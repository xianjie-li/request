import axios from 'axios';
import statusCode from './statusCode';
import hashFnv32a from './hash';

function getGlobal() {
  return typeof window !== 'undefined' ? window : global;
}

const dumpFn = () => {};

const defaultConf = {
  axiosBaseConfig: {},
  formatResponse: (response) => response,
  startRequest: dumpFn,
  finishRequest: dumpFn,
  feedBack: dumpFn,
};

function createRequest(_config = {}) {
  const config = {
    ...defaultConf,
    ..._config,
  };

  /* axios预设 */
  const axiosInstance = axios.create({
    ...config.axiosBaseConfig,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });

  function request(url, reqOption = {}) {
    const option = reqOption.extraOption || {};

    // 一些配置提前提出来
    const quiet = !!option.quiet;
    const formatResponse = option.formatResponse || config.formatResponse;
    const feedBack = option.feedBack || config.feedBack;
    const startRequest = option.startRequest || config.startRequest;
    const finishRequest = option.finishRequest || config.finishRequest;
    const checkStatus = option.checkStatus || config.checkStatus;
    const serverMsgField = option.serverMsgField || config.serverMsgField;

    const ptGlobal = getGlobal();

    /* ------- 缓存处理 (根据配置选项，为数字时取该数字的秒数，为truty时默认30秒) ------- */
    const expirys =
      option.expirys &&
      (typeof option.expirys === 'number'
        ? option.expirys
        : 30
      );
    let fingerprint; // 根据当前请求参数、地址生成唯一串作为令牌
    let hashcode;  // 根据fingerprint生成hash

    if (expirys) {
      /* 根据url + params + data (针对不使用params的后端) 生成hash，用于缓存请求结果 */
      /* 包含函数、formData等特殊类型的data不能进行缓存 (* 缓存只应该用于查询类的接口) */
      fingerprint =
        url +
        JSON.stringify(reqOption.data || {}) +
        JSON.stringify(reqOption.params || {});

      hashcode = hashFnv32a(fingerprint);

      /* 尝试取出匹配到的缓存数据 */
      let cached = ptGlobal.sessionStorage.getItem(hashcode);
      let cachedTime = ptGlobal.sessionStorage.getItem(`${hashcode}:timestamp`);

      if (cached && cachedTime) {
        // 当前时间到缓存结束时间差值
        const age = (Date.now() - cachedTime) / 1000;

        // 缓存生效，添加isCache标记后原样返回
        if (age < expirys) {
          let _cached = JSON.parse(cached);

          if (_cached) {
            _cached.data.isCache = true;
            return Promise.resolve([
              null,
              option.plain
                ? checkResponse(_cached)
                : formatResponse(checkResponse(_cached), option, reqOption) /* TODO: 添加自定义缓存, 传递的配置 */
            ]);
          }
        }
        // 缓存过期、清空
        sessionStorage.removeItem(hashcode);
        sessionStorage.removeItem(`${hashcode}:timestamp`);
      }
    }

    /* data不是FormData时，将data转换为JSON字符 */
    if (reqOption.data && !(reqOption.data instanceof FormData)) {
      reqOption.data = JSON.stringify(reqOption.data);
    }

    const requestConfig = {
      url,
      ...reqOption
    };

    // 接收startRequest返回值传递给finishRequest, 用于结束loading等
    let reqFlag = startRequest(option, reqOption);

    // 发起请求并进行一系列处理
    return axiosInstance(requestConfig)
      .then(checkResponse)
      .then(res => (expirys ? cache(res, hashcode) : res))
      // 到这一步已经成功了
      .then(res => [null, option.plain ? res : formatResponse(res, option, reqOption)]) // 根据format配置处理数据
      .catch(errorHandle)
      .finally(() => finishRequest(option, reqFlag));

    /* 接收response，处理数据，根据配置进行某些操作 */
    function checkResponse(response) {
      if (!quiet) {
        // 根据配置取出对应的message字段
        const message = response.data && response.data[serverMsgField];

        // 如果后端约定的返回值有异常则抛出错误
        if (!checkStatus(response.data)) {
          const error = new Error(message || 'server returned error');
          error.response = response;
          throw error;
        }

        // 返回正常但配置了useServeMsg且返回中包含message
        if (option.useServeMsg) {
          message && feedBack(message, true, option, reqOption);
        }
      }

      // 正常返回
      return response;
    }

    /* 错误处理 */
    function errorHandle(error = {}) {
      // 处理axios相关的错误码
      // if (error.code && error.isAxiosError) {
      //   if (error.code === 'ECONNABORTED') {
      //     // 模拟一个超时的响应对象
      //     error.response = {
      //       status: 408
      //     };
      //   }
      // }

      // 包含响应体，根据状态码或服务端返回的data.message进行错误反馈
      if (error.response) {
        const response = error.response;
        let message = statusCode[response.status] || 'unknown error code';
        message = `${response.status}: ${message}`;

        // 服务器状态码异常且包含serverMsgField
        const serverMessage = response.data && response.data[serverMsgField];

        !quiet && feedBack(serverMessage || message, false, option);
      } else {
        /* 没有状态码、没有服务器返回、也不在捕获范围内(跨域、地址出错完全没有发送到服务器时会出现) */
        !quiet && feedBack(error.message || 'unknown error', false, option);
      }

      return [error, null];
    }

    /* 缓存数据 */
    function cache(res, hashcode) {
      const contentType = res.headers['content-type'];
      if (contentType && contentType.match(/application\/json/i)) {
        ptGlobal.sessionStorage.setItem(hashcode, JSON.stringify(res));
        ptGlobal.sessionStorage.setItem(`${hashcode}:timestamp`, String(Date.now()));
      }
      return res;
    }
  }

  request.common = (...args) => {
    return new Promise((resolve, reject) => {
      request(...args)
        .then(([err, res]) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  };

  /* 暴露axios实例、返回request方法 */
  request.axios = axiosInstance;
  return request;
}

export default createRequest;
