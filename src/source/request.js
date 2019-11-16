/**
 * 调用axios发起请求，返回[err, res]形式的结果, 根据传入配置可进行缓存、配置化的错误反馈、显示loading、 挂token等。
 *
 * @url  {string}   请求地址
 * @option?  {object}  传递给axios的option对象,下面的是除文档参数外新增的几个额外参数
 *  @extraOption
 *    @expirys?  {boolean|number}  设置缓存时间，值为true时缓存30s，为数字时表示指定的秒数。
 *    @useServeMsg?  {boolean}  为true时即使返回状态码正确依然会以服务器返回的消息(根据serverMsgField配置项确定)作为反馈提示。
 *    @quiet?  {boolean}  静默模式，无论正确与否不会有任何提示
 *    @plain?  {boolean}  用原始的response代替经过format函数的response
 * @return {array} 一个错误优先的数组 => [err, res]
 *
 * #额外实例属性#
 * #axios  获取axios实例, 当需要直接操作axios接口时使用
 *
 * 依赖包:
 * axios、lodash/get
 *
 * * 当服务端返回裸数据时，可以任意为serverMsgField设置一个字符值，此时根据状态码进行的错误反馈依然是可用的, 如果遇到连状态码码都乱给的后端的话...emmm
 */

import axios from 'axios';
import statusCode from './statusCode';
import hashFnv32a from './hash';

function createRequest(config = {}) {
  const axiosInstance = axios.create({
    ...config.axiosBaseConfig,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });

  function request(url, reqOption = {}) {
    const option = reqOption.extraOption || {};
    const quiet = !!option.quiet;

    /* 缓存处理 (根据配置选项，为数字时取该数字的秒数，为truty时默认30秒) */
    const expirys =
      option.expirys &&
      (typeof option.expirys === 'number' ? option.expirys : 30);
    let fingerprint;
    let hashcode;

    if (expirys) {
      /* 根据url + params + data 生成hash，用于缓存请求结果 */
      /* 包含函数、formdata等特殊类型的data不能进行缓存 (* 缓存只应该用于查询类的接口) */
      fingerprint =
        url +
        JSON.stringify(reqOption.data || {}) +
        JSON.stringify(reqOption.params || {});

      hashcode = hashFnv32a(fingerprint);

      // 尝试取出匹配到的缓存数据
      let cached = sessionStorage.getItem(hashcode);
      let cachedTime = sessionStorage.getItem(`${hashcode}:timestamp`);

      if (cached && cachedTime) {
        const age = (Date.now() - cachedTime) / 1000;
        if (age < expirys) {
          // 缓存生效，添加isCache标记后原样返回
          let _cached = JSON.parse(cached);
          _cached.data.isCache = true;
          return Promise.resolve([
            null,
            option.plain
              ? checkResponse(_cached)
              : config.formatResponse(checkResponse(_cached))
          ]);
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

    let reqFlag = config.startRequest(option, requestConfig);

    // 发起请求并进行一系列处理
    return axiosInstance(requestConfig)
      .then(checkResponse)
      .then(res => (expirys ? cache(res, hashcode) : res))
      .then(res => [null, option.plain ? res : config.formatResponse(res)]) // 根据format配置处理数据
      .catch(errorHandle)
      .finally(() => config.finishRequest(option, reqFlag));

    /* 接收response，处理数据，根据配置进行某些操作 */
    function checkResponse(response) {
      if (!quiet) {
        const message = response.data && response.data[config.serverMsgField];

        // 如果后端约定的返回值有异常则抛出错误
        if (!config.checkStatus(response.data)) {
          const error = new Error(message || 'server returned error');
          error.response = response;
          throw error;
        }

        // 返回正常但配置了useServeMsg且返回中包含message
        if (option.useServeMsg) {
          message && config.feedBack(message, true, option);
        }
      }

      // 正常返回
      return response;
    }

    /* 错误处理 */
    function errorHandle(error) {
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
        const serverMessage = response.data && response.data[config.serverMsgField];

        !quiet && config.feedBack(serverMessage || message, false, option);
      } else {
        /* 没有状态码、没有服务器返回、也不在捕获范围内(跨域、地址出错完全没有发送到服务器时会出现) */
        !quiet && config.feedBack(error.message || 'unknown error', false, option);
      }

      return [error, null];
    }

    /* 缓存数据 */
    function cache(res, hashcode) {
      const contentType = res.headers['content-type'];
      if (contentType && contentType.match(/application\/json/i)) {
        sessionStorage.setItem(hashcode, JSON.stringify(res));
        sessionStorage.setItem(`${hashcode}:timestamp`, Date.now());
      }
      return res;
    }
  }

  /* 暴露axios实例、返回request方法 */
  request.axios = axiosInstance;
  return request;
}

export default createRequest;
