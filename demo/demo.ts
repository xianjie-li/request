import createInstance from '../src';

// 默认使用fetch进行请求，RequestInit是fetch的配置对象类型
const request = createInstance<RequestInit>({
  // 配置反馈方式
  feedBack(message: string, status: boolean) {
    console.log('请求提示:', status ? '成功' : '失败', message);
  },
  // 将response格式化为自己想要的格式后返回
  format(response) {
    const data = response?.data?.data;
    return data || response;
  },
  // 在状态码正常时，根据返回值检测该次请求是否成功
  checkStatus(data: any) {
    return data && data.code === 0;
  },
  // 用来从服务端请求中提取提示文本的字段
  messageField: 'message',
  // 请求开始，可以在此配置loading，token等
  start({ loading }) {
    console.log('请求开始');
    loading && console.log(loading);
    return Math.random();
  },
  // 请求结束，在此关闭loading或执行其它清理操作, flag是start()中返回的值
  finish(extraOption, requestConfig, flag?: any) {
    console.log('请求结束', flag);
  },
});

request<{ name: string }>('http://localhost:3000/user', {
  method: 'get',
  extraOption: {
    useServeFeedBack: true,
    loading: '请求中...',
  },
}).then(([err, res]) => {
  console.log('-----请求完成-----');
  console.log('err:', err);
  console.log('res:', res);

  if (err || !res) return;

  // 在这里执行请求成功后的操作
});
