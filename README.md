## Introduce
调用axios发起请求，返回[err, res]形式的结果, 根据传入配置可进行缓存、配置化的错误反馈、显示loading、 挂token等。用于替代之前的fetch版本(fetch对一些复杂的请求场景如: 上传进度，超时，取消请求等功能支持不完善)

<br>

## Installation
```shell
npm install @lxjx/request
// or
yarn add @lxjx/request
```


<br>

## Features
* 与axios(option)方法使用完全一致, 但额外添加了一些便于使用的配置
* 请求缓存。如果参数完全一致可使用可选的缓存选项进行接口缓存，重复请求直接输出相同的结果。
* 对请求异常的自动化处理。
* 方便集成统一的请求loading与请求前操作（配置公共token头等）。

<br>

## 快速上手
### 根据项目进行配置
```js
import createRequest from '@lxjx/request';

let request = createRequest({
  /* axios相关 */
  // 创建axios实例时传入的初始配置
  axiosBaseConfig: {
    baseURL: '',
    timeout: 8000,
  },

  /* 服务端约定配置 */
  serverMsgField: 'message', // 服务端返回的消息提示所在的属性名, 支持.链接 如 xxx.message
  checkStatus(data) {
    // 接收服务端返回并根据约定的属性名返回一个bool值帮助判定本次请求成功与否
    return data.status;
  },

  /* 自定义错误反馈方式 */
  /**
   * @description 用于自定义信息反馈的插件, 不用处理quite的情况
   * @message {string} 根据response生成的一段提示文本
   * @status {boolean} 状态 true:成功 false:失败。 根据response自动生成
   * @extraOption {object} 请求时传入的额外配置
   */
  feedBack(message, status, extraOption) {
    console.log(status ? '成功:' : '失败:' , message, extraOption);
  },
  /* 默认会原样返回response，可以通过此方法对返回格式化 */
  formatResponse(res) {
    return res.data;
  },

  /**
   * 开始/结束请求，用于配置加载状态和往header上挂公共token等
   * extraOption是请求是传入的配置对象
   * requestConfig 是传递给axios的option配置项
   *  */
  startRequest(extraOption, requestConfig) {
    console.log('----请求开始----');
    // return 'flag';
  },

  /* flag是startRequest中return的值，一般用于关闭loading时对弹窗组件进行标记 */
  finishRequest(extraOption, flag) {
    console.log('----请求结束----');
  }
});

```


### 使用
```js
import { request } from './requst';

// Promise
request('/api/file', {
    method: 'POST',
    data,
    extraOption: {
      expirys: 10,	// 缓存10秒
      useServeMsg: false,	// 即使状态码为正确，依然使用指定字段的服务器返回进行反馈
      quiet: false,	// 静默模式，无论正确与否不会有任何提示
      plain: false	// 用原始的response代替经过format函数的response
    }
  }).then(([err, res]) => {
    console.log('res', err, res);
  })

// async（推荐的方式）
async function dome2() {
  let [err, res] = request('/api/file', {
    method: 'POST',
    data,
    extraOption: {
      expirys: 10,	// 缓存10秒
      useServeMsg: false,	// 即使状态码为正确，依然使用指定字段的服务器返回进行反馈
      quiet: false,	// 静默模式，无论正确与否不会有任何提示
      plain: false	// 用原始的response代替经过format函数的response
    }
  })
  
  // 错误以及经过合理的方式进行内部处理，当在config.feedback中正确配置过之后可以不用再关系接口的错误状态。
  if(err) return;   
  
  
  // 进行请求成功的操作
}

```

<br>

## API 概览

```js
/**
 * 调用axios发起请求，返回[err, res]形式的结果, 根据传入配置可进行缓存、配置化的错误反馈、显示loading、 挂token等。用于替代之前的fetch版本(fetch对一些复杂的请求场景如: 上传进度，超时，取消请求等功能支持不完善)
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
```

