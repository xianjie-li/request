# 项目地址
[github](https://github.com/qq1073830130)

<br>

# request
基于axios进行请求的高阶函数，调用axios发起请求，返回错误和请求结果, 根据传入配置进行缓存、错误反馈、显示loading等,用于替代之前的fetch版本(fetch对上传进度，超时，取消请求等功能支持不完善或完全不支持)

<br>

# Features
* 与axios(option)方法使用完全一致, 但额外添加了一些便于使用的函数
* 请求缓存。根据请求的url，option.body，option.params来对比两次请求，如果参数完全一致可使用可选的缓存选项进行接口缓存，重复请求直接输出相同的结果。
* 通过简单的配置即可完全自动的处理请求错误。
* 方便集成统一的请求前后loading与隐藏等。

> 没有npm包，直接下载源码食用!

<br>

# 快速上手
### 根据项目进行配置
```js
/* 自定义配置 */
export default createRequst({
  /* axios相关 */
  baseURL: '', // 对应axios的baseURL
  timeout: 8000, // timeout

  /* 服务端返回相关 */
  // 这里假设后端接口返回格式如下: {
  //    msg: '操作成功!',
  //    errno: 0,   // 0为成功,其他值为失败
  //    data: null
  // }
  serverMsgField: 'msg', // 从response.data取服务器返回的msg时用的字段名
  serverStatusField: 'errno', // 后端自定的状态码键名，一般为code、errno、status等
  serverStatusIsSuccess(status) {
    // 自定的状态码的正确范围，返回值为falsy时抛出错误并使用serverMsgField作为反馈
    return status === 0;
  },

  /* 自定义错误反馈方式 */
  /**
   * @description 根据传入的字符串对用户进行反馈
   * @msg {Str} 用于反馈的消息
   * @status {Str} 状态 true:成功 false:失败
   */
  feedBack(msg, status) {
    status ? alert('操作成功: ' + msg) : alert('操作失败: ' + msg);
  },

  /* 开始/结束请求，可用于配置加载状态, option是请求是传入的配置对象 */
  startRequest(option) {
    if(option.loading) {
      console.log({
        text: option.loading.text || 'loading...',
        mask: false
      });
    }
  },
  finishRequest(option) {
    if(option.loading) {
      console.log('loading end');
    }
  }
});

```


### 使用实例
```js
import request2 from '@/utils/request';


request2('/api/file', {
    method: 'POST',
    data,
    expirys: 10,  // 参数相同时缓存10秒
    useServeMsg: true,  // 即使状态码为正确，依然使用服务器的msg进行反馈(请求发生错误时这是默认行为,当请求错误时会以后端返回的msg或请求状态码生成的错误信息进行返回)
    // quiet: true,  // 静默模式，无论正确与否不会有任何提示
    loading: {  // 设置loading
      text: '加载中...',
      mask: true
    }
  }).then(([err, res]) => {
    console.log('res', err, res);
  })

```