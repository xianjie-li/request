/**
 *
 *
 */

import 'whatwg-fetch';
import hash from 'hash.js';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。'
};

/* check status = false, 检测后端手动返回的状态码 */
const checkQuestResult = response => {
  response
    .clone()
    .json()
    .then(res => {
      /* 根据后端约定的状态码check错误 */
      // if (res.status === false) {
      //   alert(res.message);
      // }
    })
    .catch(err => {
      console.log(err);
    });

  return response;
};

/**
 * 接收一个fetch response对象，状态码异常时抛出错误。
 * @param   {Object} response  fetch response
 * @returns {Object}
 */
const checkStatus = response => {
  /*  */
  // 新增：400以内也列为成功
  // if (response.status >= 200 && response.status !== 401 && response.status < 500) {
  //   return response;
  // }

  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;

  // console.log(response.url);
  // Toast.offline(`${response.status}: ${errortext}`, 3, null, false);

  alert(`${response.status}: ${errortext}`);

  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
};

const cachedSave = (response, hashcode) => {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.match(/application\/json/i)) {
    // All data is saved as text
    response
      .clone()
      .text()
      .then(content => {
        sessionStorage.setItem(hashcode, content);
        sessionStorage.setItem(`${hashcode}:timestamp`, Date.now());
      });
  }
  return response;
};

/**
 * Requests a URL, returning a promise.
 *
 * @param  {str} url       请求地址
 * @param  {obj} [option]  传递给fetch的option对象
 *    @param  {bool|num} expirys  设置缓存时间，值为true时缓存30s，数字为指定的秒数。
 * @return {obj}           An object containing either "data" or "err"
 */
export default function request(url, option) {
  const options = {
    ...option
  };

  /* 根据url + params + fetch.body 生成hash，用于缓存请求结果 */
  const fingerprint = url + (options.body ? JSON.stringify(options.body) : '');
  const hashcode = hash
    .sha256()
    .update(fingerprint)
    .digest('hex');

  const defaultOptions = {
    credentials: 'include'
  };
  const newOptions = { ...defaultOptions, ...options };

  /* 不区分请求类型，一律添加请求头 */
  // if (
  //   newOptions.method === 'POST' ||
  //   newOptions.method === 'PUT' ||
  //   newOptions.method === 'DELETE'
  // ) {
  if (!(newOptions.body instanceof FormData)) {
    newOptions.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      ...newOptions.headers
    };
    newOptions.body = JSON.stringify(newOptions.body);
  } else {
    // newOptions.body is FormData
    newOptions.headers = {
      Accept: 'application/json',
      ...newOptions.headers
    };
  }
  // }

  const expirys =
    options.expirys && typeof options.expirys === 'number'
      ? options.expirys
      : 30;
  // options.expirys !== false, return the cache,
  if (options.expirys) {
    const cached = sessionStorage.getItem(hashcode);
    const whenCached = sessionStorage.getItem(`${hashcode}:timestamp`);
    if (cached !== null && whenCached !== null) {
      const age = (Date.now() - whenCached) / 1000;
      if (age < expirys) {
        const response = new Response(new Blob([cached]));
        return response.json();
      }
      sessionStorage.removeItem(hashcode);
      sessionStorage.removeItem(`${hashcode}:timestamp`);
    }
  }

  return fetch(url, newOptions)
    .then(checkQuestResult)
    .then(checkStatus)
    .then(response => cachedSave(response, hashcode))
    .then(response => {
      // DELETE and 204 do not return data by default
      // using .json will report an error.
      if (newOptions.method === 'DELETE' || response.status === 204) {
        return response.text();
      }
      return response.json();
    })
    .catch(e => {
      console.log('request Error', e);

      const status = e.name;
      if (status === 401) {
        alert('请先登录');
        return;
      }
      // environment should not be used
      if (status === 403) {
        alert('访问被禁止');
        return;
      }
      if (status <= 504 && status >= 500) {
        alert('网络连接异常~');
        return;
      }
      if (status >= 404 && status < 422) {
        alert('您要访问的连接已丢失');
        return;
      }
    });
}
