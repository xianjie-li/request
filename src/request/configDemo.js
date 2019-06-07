/* 自定义配置 */
export default createRequst({
  /* axios相关 */
  // 创建axios实例时传入的初始配置
  axiosInitConfig: {
    baseURL: '', // 对应axios的baseURL
    timeout: 8000, // timeout
  },

  /* 服务端返回相关 */
  serverMsgField: 'msg', // 从response.data取服务器返回的msg时用的字段名
  serverStatusField: 'errno', // 后端自定的状态码键名，一般为code、errno、status等
  serverStatusIsSuccess(status) {
    // 自定的状态码的正确范围，返回值为falsy时抛出错误并使用serverMsgField作为反馈
    return status === 0;
  },

  /* 默认会原样返回response，可以通过此方法对返回格式化 */
  formatResponse(res) {
    return res.data;
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
      console.log('loading', option);

      // 某些loading控件会返回一个标识用来关闭，可以通过return返回后在finishRequest中接收
      return 'testFlag';
    }
  },
  /* flag是startRequest中return的值，一般用于关闭loading */
  finishRequest(option, loadingFlag) {
    if(option.loading) {
      console.log('loading end', option, loadingFlag);
    }
  }
});