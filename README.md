## Introduce
基于axios，用于对请求进行集中式处理

<!-- TOC -->

- [Introduce](#introduce)
- [Installation](#installation)
- [Feature](#feature)
- [快速上手](#快速上手)
  - [根据项目进行配置](#根据项目进行配置)
  - [使用](#使用)
- [API 概览](#api-概览)
  - [createRequest](#createrequest)
  - [Request](#request)
  - [CreateOptions](#createoptions)
  - [FullOptions](#fulloptions)
  - [extraOption](#extraoption)
  - [BaseOptions](#baseoptions)

<!-- /TOC -->

<br>

## Installation
```shell
yarn add @lxjx/request
// or
npm install @lxjx/request
```

<br>

## Feature
* 与axios API几乎无差异, 只是额外添加了一些便于开发使用的配置
* 请求缓存
* 全局配置异常请求的错误反馈规则，减少心智负担
* 方便集成统一的请求loading与请求前后操作（配置token等）
* 其他方便的东西

<br>

## 快速上手
### 根据项目进行配置
```js
import createRequest from '@lxjx/request';

const request = createRequest({
  /* ---- axios相关 ---- */
  // 创建axios实例时传入的初始配置
  axiosBaseConfig: {
    baseURL: '',
    timeout: 8000,
  },

  /* ---- 服务端约定配置 (必传) ----  */
  // 下面的配置假设服务器返回了 { message: '操作成功', status: true } 这样的数据，具体需要根据项目进行配置
    
  // 服务端返回的消息提示所在的字段, 如果后端未约定可以传任意字符占位
  serverMsgField: 'message',
    
  // 接收服务端返回并根据约定的属性名返回一个bool值帮助判定本次请求成功与否
  checkStatus(data) {
    return data.status;
  },

  /* ---- 定义错误反馈方式 ---- */
  // 这里用于通过某些弹层组件进行反馈提示, status = true只有请求时传入了useServeMsg选项才生效
  feedBack(message, status, extraOption, requestConfig) {
    alert(status ? '成功:' : '失败:' , message);
  },
    
  /* ---- 格式化返回 ---- */
  /* 默认会原样返回response，可以通过此方法对返回格式化 */
  formatResponse(res, extraOption, requestConfig) {
    return res.data;
  },

  /**
   * 开始/结束请求，用于配置加载状态和往header上挂公共token等
   * extraOption是请求是传入的配置对象
   * requestConfig 是传递给axios的option配置项, 用于在发送之前手动增加或修改某些配置
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
  
  // 错误已经过合理的方式进行内部处理，当在config.feedback中正确配置过之后可以不用再关心接口的错误状态。
  if(err) return;   
  
  
  // 进行请求成功的操作
}

```

<br>

## API 概览

### createRequest

创建一个request函数实例

```ts
function createRequest(options: CreateOptions): Request;
```



### Request

```ts
/**
 * 用于请求的request函数
 * @param url - 请求地址
 * @param options - 配置项、与axios完全相同，除了添加额外的extraOption选项
 * @return 一个Promise，当resolve时，会得到一个错误优先的数组 [error, data]
 * @static axiosInstance - axios实例
 * @static common - 常规的Promise版本request，不返回错误优先数组而是常规Promise对象
 * */
interface Request {
  <Data = any>
  (
    url: string,
    options?: FullOptions
  ): Promise<[any, Data]>;
  axiosInstance: AxiosInstance;
  common: <Data = any>() => Promise<Data>
}
```



### CreateOptions

```ts
interface CreateOptions extends BaseOptions  {
  /** axios相关配置 */
  axiosBaseConfig?: AxiosRequestConfig;
}
```



### FullOptions

一份整齐的`request(url, options)`配置

```ts
/** 完整配置继承自axios */
interface FullOptions extends AxiosRequestConfig {
  extraOption?: Partial<extraOption>;
}
```



### extraOption

额外传递给axios的配置对象

```ts
interface extraOption extends BaseOptions {
  /** 设置缓存时间，值为true时缓存30s，为数字时表示指定的秒数。 */
  expirys: boolean | number;
  /** 为true时即使返回服务器状态码正确依然会以服务器返回的消息(根据serverMsgField配置项确定)作为反馈提示。 */
  useServeMsg: boolean;
  /** 静默模式，无论正确与否不会有任何提示 */
  quiet: boolean;
  /** 默认直接返回经过formatResponse处理的结果，传递后会返回原始的response */
  plain: boolean;
  /** 是否显示加载 */
  loading: boolean | string;
  /** 用于传递其他额外配置时，如 hasToken */
  [key: string]: any;
}
```



### BaseOptions

 局部request配置和全局配置中通用的配置，request中传递的组件及配置优先级最高

```ts
interface BaseOptions {
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求时候成功(状态码等在内部已处理，只需要关系服务器实际返回的data) */
  checkStatus(data: any): boolean;
  /** 服务端返回的消息提示所在的字段, 如果后端未约定可以传任意字符占位 */
  serverMsgField: string;
  /**
   * 自定义反馈方式
   * @param message - 根据返回生成的可读提示文本
   * @param status - 成功/失败
   * @param extraOption - 传递的额外配置
   * @param requestConfig - request(url, option)中的配置
   * */
  feedBack?(message: string, status: boolean, extraOption: extraOption, requestConfig: FullOptions): void;
  /** 根据服务器返回的数据格式化为自己想要的格式并返回 */
  formatResponse?(response: any, extraOption: extraOption, requestConfig: FullOptions): any;
  /** 请求开始 参数为额外配置和 request(url, option)传递的完整配置 */
  startRequest?(extraOption: extraOption, requestConfig: FullOptions): any;
  /** 请求结束, flag是startRequest方法的返回值 */
  finishRequest?(extraOption: extraOption, flag?: any): void;
}
```



















