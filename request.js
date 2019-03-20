
/**
 * 调用axios发起请求，返回错误和请求结果, 根据传入配置进行缓存、错误反馈、显示loading等,用于替代之前的fetch版本(fetch对上传进度，超时，取消请求等功能支持不完善或完全不支持)
 *
 * @url  {Str}   请求地址
 * @option  {Obj?} 传递给axios的option对象,下面的是除文档参数外新增的几个额外参数
 *    @expirys  {Bool|Num?}  设置缓存时间，值为true时缓存30s，数字为指定的秒数。
 *    @useServeMsg  {Bool?}  为true时即使返回状态码正确依然会以服务器返回的消息作为反馈提示。
 *    @quiet  {Bool?}  静默模式，无论正确与否不会有任何提示
 *    @loading {Bool|Obj?}
 *        text: {Str}   加载时显示的文本
 *        mask: {Bool}  出现蒙层阻塞其他操作
 * @return {Arr} 一个错误优先的数组 => [err, res]
 * 
 * #额外实例属性#
 * #instance  获取axios实例,可用于动态设置header或其他默认值
 *
 * 依赖包:
 * hash.js、axios
 */

import hash from 'hash.js';
import axios from 'axios';
import codeMessage from './statusCode';

export default function createRequst(opt) {
  const axiosInstance = axios.create({
    baseURL: opt.baseURL,
    timeout: opt.timeout,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  });

  function request(url, option = {}) {
    const _option = {
      ...option
    };

    /* 缓存 */
    const expirys =
      _option.expirys &&
      (typeof _option.expirys === 'number' ? _option.expirys : 30);

    let fingerprint, hashcode;

    if (expirys) {
      /* 根据url + params + data 生成hash，用于缓存请求结果 */
      /* 包含函数、formdata等特殊类型的data不能进行缓存 */
      fingerprint =
        url +
        JSON.stringify(_option.data || {}) +
        JSON.stringify(_option.params || {});

      hashcode = hash
        .sha256()
        .update(fingerprint)
        .digest('hex');

      let cached = sessionStorage.getItem(hashcode);
      let whenCached = sessionStorage.getItem(`${hashcode}:timestamp`);

      if (cached !== null && whenCached !== null) {
        const age = (Date.now() - whenCached) / 1000;
        if (age < expirys) {
          let _cached = JSON.parse(cached);
          _cached.data.isCache = true;
          checkResponse(_cached);
          return Promise.resolve([null, _cached.data]);
        }
        sessionStorage.removeItem(hashcode);
        sessionStorage.removeItem(`${hashcode}:timestamp`);
      }
    }

    /* 非formdata时，将data转换为字符串 */
    if (_option.data && !(_option.data instanceof FormData)) {
      _option.data = JSON.stringify(_option.data);
    }

    opt.startRequest(_option);

    // 发起请求，处理返回
    return axiosInstance({
      url,
      ..._option
    })
      .then(checkResponse)
      .then(res => (expirys ? cachedSave(res, hashcode) : res))
      .then(res => [null, res.data])
      .catch(errHandle)
      .finally(() => opt.finishRequest(_option));
  };

  /* 接收response，处理数据，根据配置进行某些操作 */
  function checkResponse(res) {
    let quiet = res.config.quiet || false;

    /* 判断服务器是否主动声明错误, 是的话直接抛出 */
    if (
      !quiet &&
      res.data[opt.serverStatusField] &&
      !opt.serverStatusIsSuccess(res.data[opt.serverStatusField])
    ) {
      const error = new Error('服务器自定义错误');
      error.response = res;
      error.config = res.config;
      throw error;
    }

    /* 返回状态正确且配置需要使用服务端消息进行反馈 */
    if (!quiet && res.config.useServeMsg) {
      opt.feedBack(res.data[opt.serverMsgField], true);
    }

    return res;
  }

  /* 对catch到的请求错误进行处理 */
  function errHandle(err) {
    /* 超时时手动生成错误返回对象 */
    if (err.code && err.code === 'ECONNABORTED') {
      err.response = {
        status: 408
      };
    }
    
    let res = err.response || {};

    const errortext = codeMessage[res.status] || res.statusText;

    let errMsg = `${res.status}: ${errortext}`;

    /* 过滤错误信息 */
    let quiet = err.config.quiet;

    err = err.response;

    /* 如果服务器有返回错误信息，用服务器的，否则根据status返回错误信息。*/
    let serverMsg = err.data && err.data[opt.serverMsgField];
    !quiet && opt.feedBack(serverMsg || errMsg, false);

    /* TODO: 失败时将状态码传入某个错误回调中 */

    return [{ ...err }, null];
  }

  /* 缓存数据到本地 */
  function cachedSave(res, hashcode) {
    const contentType = res.headers['content-type'];
    if (contentType && contentType.match(/application\/json/i)) {
      sessionStorage.setItem(hashcode, JSON.stringify(res));
      sessionStorage.setItem(`${hashcode}:timestamp`, Date.now());
    }
    return res;
  }


  request.instance = axiosInstance;
  return request;
}