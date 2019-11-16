import React from 'react';

import createRequest from '../source/request';

let request = createRequest({
  /* axios相关 */
  // 创建axios实例时传入的初始配置
  axiosBaseConfig: {
    baseURL: '',
    timeout: 3000,
  },

  /* 服务端约定配置 */
  serverMsgField: 'message', // 服务端返回的消息提示所在的属性名
  checkStatus(data) {
    // 接收服务端返回并根据约定的属性名返回一个bool值帮助判定本次请求成功与否
    return data.status === true;
  },

  /* 自定义错误反馈方式 */
  /**
   * @description 用于自定义信息反馈的插件, 不用处理quite的情况
   * @message {string} 根据response生成的一段提示文本
   * @status {boolean} 状态 true:成功 false:失败。 根据response自动生成
   * @extraOption {object} 请求时传入的额外配置
   */
  feedBack(message, status, extraOption) {
    console.log(status ? '成功:' : '失败:', message, extraOption);
  },
  /* 默认会原样返回response，可以通过此方法对返回格式化 */
  formatResponse(res) {
    return res.data;
  },

  /**
   * 开始/结束请求，用于配置加载状态和往header上挂公共token等
   * option是请求是传入的配置对象
   * requestConfig 是传递给axios的option配置项, 用于在发送之前手动增加或修改某些配置
   *  */
  startRequest(extraOption, requestConfig) {
    console.log('----请求开始----', requestConfig);
    // return 'flag';
  },

  /* flag是startRequest中return的值，一般用于关闭loading时对弹窗组件进行标记 */
  finishRequest(extraOption, flag) {
    console.log('----请求结束----', extraOption);
  },
});

request('http://127.0.0.1:4567/api/get?name=lxj&age=18', {
  data: {
    name: 'lx11j',
    age: 18,
  },
  extraOption: {
    // expirys: 3,
    useServeMsg: true,
    quiet: false,
    plain: true,
  },
})
  .then(res => {
    console.log(1, res);
  });

const Demo = () => {
  return (
    <div>
      Demo
    </div>
  );
};

export default Demo;
