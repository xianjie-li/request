import React from 'react';

import createRequest from '../source/request';

let request = createRequest({
  axiosBaseConfig: {
    baseURL: '',
    timeout: 3000,
  },
  serverMsgField: 'message', // 服务端返回的消息提示所在的属性名
  checkStatus(data) {
    // 接收服务端返回并根据约定的属性名返回一个bool值帮助判定本次请求成功与否
    return data.code === 0;
  },
  feedBack(message, status, extraOption) {
    console.log(status ? '成功:' : '失败:', message, extraOption);
  },
  formatResponse(res) {
    return res;
  },
  startRequest(extraOption, requestConfig) {
    // console.log('----请求开始----', requestConfig);
    // return 'flag';
  },
  finishRequest(extraOption, flag) {
    // console.log('----请求结束----', extraOption);
  },
});

request('http://127.0.0.1:3000/user', {
  data: {
    name: 'lx11j',
    age: 18,
  },
  extraOption: {
    // expirys: 3,
    useServeMsg: true,
    quiet: false,
    // plain: true,
    formatResponse(res) {
      return res.data;
    },
    feedBack(message, status, extraOption) {
      console.log(111, message)
    }
  },
})
  .then(res => {
    console.log(res);
  });

const Demo = () => {
  return (
    <div>
      Demo
    </div>
  );
};

export default Demo;
