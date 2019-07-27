import hash from 'hash.js';
import axios from 'axios';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  408: '请求超时',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。'
};

var defaultConfig = {
  axiosInitConfig: {},
  formatResponse: function formatResponse(res) {
    return res;
  },
  feedBack: function feedBack() {},
  startRequest: function startRequest() {},
  finishRequest: function finishRequest() {}
};

function createRequst(opt) {
  opt = _objectSpread2({}, defaultConfig, {}, opt);
  var axiosInstance = axios.create(_objectSpread2({}, opt.axiosInitConfig, {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  }));

  function request(url) {
    var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var _option = _objectSpread2({}, option);
    /* 缓存 */


    var expirys = _option.expirys && (typeof _option.expirys === 'number' ? _option.expirys : 30);
    var fingerprint, hashcode;

    if (expirys) {
      /* 根据url + params + data 生成hash，用于缓存请求结果 */

      /* 包含函数、formdata等特殊类型的data不能进行缓存 */
      fingerprint = url + JSON.stringify(_option.data || {}) + JSON.stringify(_option.params || {});
      hashcode = hash.sha256().update(fingerprint).digest('hex');
      var cached = sessionStorage.getItem(hashcode);
      var whenCached = sessionStorage.getItem("".concat(hashcode, ":timestamp"));

      if (cached !== null && whenCached !== null) {
        var age = (Date.now() - whenCached) / 1000;

        if (age < expirys) {
          var _cached = JSON.parse(cached);

          _cached.data.isCache = true;
          checkResponse(_cached);
          return Promise.resolve([null, _cached.data]);
        }

        sessionStorage.removeItem(hashcode);
        sessionStorage.removeItem("".concat(hashcode, ":timestamp"));
      }
    }
    /* 非formdata时，将data转换为字符串 */


    if (_option.data && !(_option.data instanceof FormData)) {
      _option.data = JSON.stringify(_option.data);
    }

    var loadingFlag = opt.startRequest(_option); // 发起请求，处理返回

    return axiosInstance(_objectSpread2({
      url: url
    }, _option)).then(checkResponse).then(function (res) {
      return expirys ? cachedSave(res, hashcode) : res;
    }).then(function (res) {
      return [null, opt.formatResponse ? opt.formatResponse(res) : res];
    }).catch(errHandle).finally(function () {
      return opt.finishRequest(_option, loadingFlag);
    }); // 这里传入原配置
  }
  /* 接收response，处理数据，根据配置进行某些操作 */

  function checkResponse(res) {
    var quiet = res.config.quiet || false;
    /* 判断服务器是否主动声明错误, 是的话直接抛出 */

    if (!quiet && res.data[opt.serverStatusField] && !opt.serverStatusIsSuccess(res.data[opt.serverStatusField])) {
      var error = new Error('服务器自定义错误');
      error.response = res;
      error.config = res.config;
      throw error;
    }
    /* 返回状态正确且配置需要使用服务端消息进行反馈 */


    if (!quiet && res.config.useServeMsg) {
      opt.feedBack(res.data[opt.serverMsgField], true, res.config);
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

    if (err.response) {
      var res = err.response || {};
      var errortext = codeMessage[res.status] || res.statusText;
      var errMsg = "".concat(res.status, ": ").concat(errortext);
      /* 过滤错误信息 */

      var quiet = err.config.quiet || false;
      err = err.response || {};
      /* 如果服务器有返回错误信息，用服务器的，否则根据status返回错误信息。*/

      var serverMsg = err.data && err.data[opt.serverMsgField];
      !quiet && opt.feedBack(serverMsg || errMsg, false, err.config);
    } else {
      /* 没有状态码、没有服务器返回、也不再捕获范围内(跨域、地址出错完全没有发送到服务器时会出现) */
      opt.feedBack('未知错误', false, err.config);
    }
    /* TODO: 失败时将状态码传入某个错误回调中 */


    return [_objectSpread2({}, err), null];
  }
  /* 缓存数据到本地 */


  function cachedSave(res, hashcode) {
    var contentType = res.headers['content-type'];

    if (contentType && contentType.match(/application\/json/i)) {
      sessionStorage.setItem(hashcode, JSON.stringify(res));
      sessionStorage.setItem("".concat(hashcode, ":timestamp"), Date.now());
    }

    return res;
  }

  request.instance = axiosInstance;
  return request;
}

export default createRequst;
