import createInstance from '../src';
import axios, { AxiosRequestConfig } from 'axios';

// 通过传入AxiosRequestConfig来指定request(options)中options的类型
const request = createInstance<AxiosRequestConfig>({
  /* ############## 适配器配置 ############## */

  // 启用axios
  // - 直接传入是因为axios(option)接口支持, 也可以写成 `fetchAdapter: opt => axios(opt)`
  // - 其他的如fetch为 `fetchAdapter: ({ url, ...opt }) => fetch(url, opt)`
  fetchAdapter: axios,

  /* ############## 其他配置: 拦截器、加载状态、消息反馈、根据服务器返回进行的个性化配置等 ##############  */

  // 在http状态码正常时，根据返回值检测该次请求是否成功
  checkStatus(data: any) {
    return data && data.code === 0;
  },
  // 用来从服务端请求中提取提示文本的字段
  messageField: 'message',
  // 配置正确或错误的反馈方式
  feedBack(message: string, status: boolean) {
    console.log('请求提示:', status ? '成功' : '失败');
    console.log('反馈消息:', message);
  },
  // 将response预格式化为自己想要的格式后返回
  format: response => response?.data?.data,
  // 请求开始，可以在此配置loading，token等
  start(extraOption, requestConfig) {
    console.log('请求开始');

    requestConfig.headers = {
      ...requestConfig.headers,
      token: 'a token',
    };

    extraOption.loading && console.log('请求中...');

    return Math.random(); // 返回值作为finish的第三个参数传入，用于关闭弹窗等
  },
  // 请求结束，在此关闭loading或执行其它清理操作, flag是start()中返回的值
  finish(extraOption, requestConfig, flag?: any) {
    console.log('请求结束', flag);
  },
});

interface ResponseType {
  name: string;
  age: number;
}

// 通过request发起请求，ResponseType是返回值的类型，默认为any
request<ResponseType>('/api/user', {
  // 正常的axios配置
  method: 'POST',
  timeout: 8000,
  // 独立于axios的额外配置，用于增强请求行为
  extraOption: {
    useServeFeedBack: true,
    loading: true,
  },
}).then(([err, res]) => {
  console.log('-----请求完成-----');
  console.log('err:', err);
  console.log('res:', res);

  // 当err存在时表示该次请求包含错误
  if (err || !res) return;

  // 在这里执行请求成功后的操作
});

// 如果不喜欢错误优先风格的请求方式，也可以使用promise版本
request
  .promise<ResponseType>('/api/user', {
    method: 'POST',
    extraOption: {
      loading: true,
    },
  })
  .then(res => {
    console.log(res);
  })
  .catch(err => {
    console.log(err);
  });
