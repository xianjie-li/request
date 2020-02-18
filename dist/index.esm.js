import _slicedToArray from '@babel/runtime/helpers/esm/slicedToArray';
import _defineProperty from '@babel/runtime/helpers/esm/defineProperty';
import axios from 'axios';

var statusCode = {
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

function hashFnv32a(str) {
  var i,
      l,
      hval = 0x811c9dc5;

  for (i = 0, l = str.length; i < l; i++) {
    hval ^= str.charCodeAt(i);
    hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }

  return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function getGlobal() {
  return typeof window !== 'undefined' ? window : global;
}

var dumpFn = function dumpFn() {};

var defaultConf = {
  axiosBaseConfig: {},
  formatResponse: function formatResponse(response) {
    return response;
  },
  startRequest: dumpFn,
  finishRequest: dumpFn,
  feedBack: dumpFn
};

function createRequest() {
  var _config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var config = _objectSpread({}, defaultConf, {}, _config);
  /* axios预设 */


  var axiosInstance = axios.create(_objectSpread({}, config.axiosBaseConfig, {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  }));

  function request(url) {
    var reqOption = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var option = reqOption.extraOption || {}; // 一些配置提前提出来

    var quiet = !!option.quiet;
    var formatResponse = option.formatResponse || config.formatResponse;
    var feedBack = option.feedBack || config.feedBack;
    var startRequest = option.startRequest || config.startRequest;
    var finishRequest = option.finishRequest || config.finishRequest;
    var checkStatus = option.checkStatus || config.checkStatus;
    var serverMsgField = option.serverMsgField || config.serverMsgField;
    var ptGlobal = getGlobal();
    /* ------- 缓存处理 (根据配置选项，为数字时取该数字的秒数，为truty时默认30秒) ------- */

    var expirys = option.expirys && (typeof option.expirys === 'number' ? option.expirys : 30);
    var fingerprint; // 根据当前请求参数、地址生成唯一串作为令牌

    var hashcode; // 根据fingerprint生成hash

    if (expirys) {
      /* 根据url + params + data (针对不使用params的后端) 生成hash，用于缓存请求结果 */

      /* 包含函数、formData等特殊类型的data不能进行缓存 (* 缓存只应该用于查询类的接口) */
      fingerprint = url + JSON.stringify(reqOption.data || {}) + JSON.stringify(reqOption.params || {});
      hashcode = hashFnv32a(fingerprint);
      /* 尝试取出匹配到的缓存数据 */

      var cached = ptGlobal.sessionStorage.getItem(hashcode);
      var cachedTime = ptGlobal.sessionStorage.getItem("".concat(hashcode, ":timestamp"));

      if (cached && cachedTime) {
        // 当前时间到缓存结束时间差值
        var age = (Date.now() - cachedTime) / 1000; // 缓存生效，添加isCache标记后原样返回

        if (age < expirys) {
          var _cached = JSON.parse(cached);

          if (_cached) {
            _cached.data.isCache = true;
            return Promise.resolve([null, option.plain ? checkResponse(_cached) : formatResponse(checkResponse(_cached), option, reqOption)
            /* TODO: 添加自定义缓存, 传递的配置 */
            ]);
          }
        } // 缓存过期、清空


        sessionStorage.removeItem(hashcode);
        sessionStorage.removeItem("".concat(hashcode, ":timestamp"));
      }
    }
    /* data不是FormData时，将data转换为JSON字符 */


    if (reqOption.data && !(reqOption.data instanceof FormData)) {
      reqOption.data = JSON.stringify(reqOption.data);
    }

    var requestConfig = _objectSpread({
      url: url
    }, reqOption); // 接收startRequest返回值传递给finishRequest, 用于结束loading等


    var reqFlag = startRequest(option, reqOption); // 发起请求并进行一系列处理

    return axiosInstance(requestConfig).then(checkResponse).then(function (res) {
      return expirys ? cache(res, hashcode) : res;
    }) // 到这一步已经成功了
    .then(function (res) {
      return [null, option.plain ? res : formatResponse(res, option, reqOption)];
    }) // 根据format配置处理数据
    .catch(errorHandle).finally(function () {
      return finishRequest(option, reqFlag);
    });
    /* 接收response，处理数据，根据配置进行某些操作 */

    function checkResponse(response) {
      if (!quiet) {
        // 根据配置取出对应的message字段
        var message = response.data && response.data[serverMsgField]; // 如果后端约定的返回值有异常则抛出错误

        if (!checkStatus(response.data)) {
          var error = new Error(message || 'server returned error');
          error.response = response;
          throw error;
        } // 返回正常但配置了useServeMsg且返回中包含message


        if (option.useServeMsg) {
          message && feedBack(message, true, option, reqOption);
        }
      } // 正常返回


      return response;
    }
    /* 错误处理 */


    function errorHandle() {
      var error = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
        var response = error.response;
        var message = statusCode[response.status] || 'unknown error code';
        message = "".concat(response.status, ": ").concat(message); // 服务器状态码异常且包含serverMsgField

        var serverMessage = response.data && response.data[serverMsgField];
        !quiet && feedBack(serverMessage || message, false, option);
      } else {
        /* 没有状态码、没有服务器返回、也不在捕获范围内(跨域、地址出错完全没有发送到服务器时会出现) */
        !quiet && feedBack(error.message || 'unknown error', false, option);
      }

      return [error, null];
    }
    /* 缓存数据 */


    function cache(res, hashcode) {
      var contentType = res.headers['content-type'];

      if (contentType && contentType.match(/application\/json/i)) {
        ptGlobal.sessionStorage.setItem(hashcode, JSON.stringify(res));
        ptGlobal.sessionStorage.setItem("".concat(hashcode, ":timestamp"), String(Date.now()));
      }

      return res;
    }
  }

  request.common = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      request.apply(void 0, args).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            err = _ref2[0],
            res = _ref2[1];

        if (err) {
          reject(err);
        }

        resolve(res);
      }).catch(function (err) {
        return reject(err);
      });
    });
  };
  /* 暴露axios实例、返回request方法 */


  request.axios = axiosInstance;
  return request;
}

export default createRequest;
