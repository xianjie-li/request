<h1 align="center" style="color: #61dafb;">Request</h1>
<h1 align="center" style="font-size: 80px;color:#61dafb">♻</h1>
<p align="center">request is easy
</p>

<br>
<br>

<!-- TOC -->

- [📑Introduce](#introduce)
- [✨Features](#features)
- [📦Installation](#installation)
- [使用](#%E4%BD%BF%E7%94%A8)
  - [`axios`](#axios)
  - [`fetch`](#fetch)
  - [`node`](#node)
  - [**`小程序`**](#%E5%B0%8F%E7%A8%8B%E5%BA%8F)
- [使用插件](#%E4%BD%BF%E7%94%A8%E6%8F%92%E4%BB%B6)
- [API](#api)
  - [`createInstance()`](#createinstance)
    - [options](#options)
  - [`request()`](#request)
    - [options](#options)

<!-- /TOC -->

## 📑Introduce

一个用来简化 XHR 请求的库

<br>
<br>

## ✨Features

- 几乎支持所有 javascript 运行时, 可以和任何请求库(fetch/axios/小程序等)搭配使用
- 集中式的错误、操作反馈
- 全局 loading、token 等
- 请求缓存
- 插件化，可以通过插件来获取更多的能力

<br>
<br>

## 📦Installation

```
yarn add @lxjx/request
// or
npm install @lxjx/request
```

<br>
<br>

## 使用

### 浏览器环境

这里以`axios`为例

💡 如果使用 js，忽略下面的所有类型声明

```ts
import createInstance from '../src';
import axios, { AxiosRequestConfig } from 'axios';

// 通过传入AxiosRequestConfig来指定request(options)中options的类型
const request = createInstance<AxiosRequestConfig>({
  /* ############## 适配器配置 ############## */

  // 启用axios
  // - 直接传入是因为axios(option)接口支持, 也可以写成 `fetchAdapter: opt => axios(opt)`
  // - 其他的如fetch为 `fetchAdapter: ({ url, ...opt }) => fetch(url, opt)`。 
  // - 💡fetch配置是默认的，如果通过fetch进行请求，可以跳过适配器配置
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
    // 一些基础配置在请求时也可以进行配置，权重大于createInstance时配置的
    start() {},
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

```

<br>

<br>

### **`其他环境`**

在其他客户端宿主环境使用(ReactNative/小程序等)时，除了适配器配置外，还需额外配置缓存方式，如果不需要缓存功能可以跳过。

以微信小程序为例：

```js
const request = createInstance({
  fetchAdapter(options) {
    return new Promise((res, rej) => {
      wx.request({
        ...options,
        success(response) {
          res(response);
        },
        fail(error) {
          rej(error);
        },
      });
    });
  },
  // 如果需要缓存，添加以下配置 (由于小程序端不支持sessionStorage，不推荐进行缓存), 不要使用异步版本的存储方法
  setStorageAdapter(key, val) {
    wx.setStorageSync(key, val);
  },
  getStorageAdapter(key) {
    return wx.getStorageSync(key);
  },
  removeStorageAdapter(key) {
    wx.removeStorageSync(key);
  },
});
```

<br>

<br>

## 使用插件

request 内部所有配置项、缓存等的功能都是由插件实现的，插件接口也对外提供，可以藉此进行功能扩展。

插件为`Plugin` 类的子类，你可以通过重写不同的钩子来为插件实现不同的能力

**`Plugin`** 类:

```ts
class Plugin {
  constructor(
    public ctx: any, // 在不同插件间共享数据的对象
    public createOptions, // createInstance()传入的配置
    public options, // request()中传入的配置
    public extraOptions, // 等于options.extraOptions
  ) {}

  /**
   * 请求开始之前
   * * 为此钩子返回一个Promise，可以阻断本次请求并以返回值作为request的返回
   * * 只要有任意一个before返回了值，任何插件的任何钩子都将不再执行
   * * 为了保证接口签名一致，最好返回与request返回一致的Promise对象
   * @example
      before() {
        return Promise.resolve([null, { tip: '这是一段直接从本地拉取的数据' }] as const);
      }
   * */
  before?(): Promise<readonly [null, any]> | void;

  /**
   * 转换请求结果并返回
   * @param response - response是根据你配置的请求库类型返回决定的
   * @return - 必须将经过处理后的response return，其他插件才能接收到经过处理后的response
   *
   * * 在转换过程中可以通过抛出错误来使该次请求'失败', 并进入catch
   * */
  pipe?(response: any): any;

  /**
   * 请求成功，对数据的处理请在pipe中执行，此函数一般不对response做处理，仅执行一些反馈或数据存储操作
   * @param response - response是根据你配置的请求库类型决定的
   * */
  success?(response: any): void;

  /** 请求失败 */
  error?(error: Error | RequestError): void;

  /** 请求结束 */
  finish?(): void;

  /**
   * 帮助函数，从extraOptions或createOptions中取出指定名称的方法，前者优先级更高, 用于方便的提取两者共有的一些配置项
   * */
  getCurrentOption(optionField: key) {
    return this.extraOptions[optionField] || this.createOptions[optionField];
  }

}
```

<br/>

以`log` 插件为例， 用来 log 每一个生命周期：

```ts
import { Plugin } from '@lxjx/request';

class Log extends Plugin {
  before() {
    console.log('请求开始啦');
  }

  pipe(response) {
    console.log('接收到response并正在进行处理');
    return response; // 务必原样返回，否则其他插件会接收不到response
  }

  success() {
    console.log('请求成功');
  }

  error() {
    console.log('请求失败');
  }

  finish() {
    console.log('请求结束');
  }
}
```

在`createInstance()`中使用

```ts
import createInstance from '@lxjx/request';

const request = createInstance({
  plugins: [Log], // 在request进行的每个生命周期进行log
  // ...其他配置
});
```

<br>

<br>

## API

> 💡 为了方便阅读，所有类型签名都是简化过的，可以在 ide 中查看更详细的签名信息。

### `createInstance()`

创建一个`Request`实例

```ts
/**
 * 创建Request实例
 * <OPTIONS> - 创建的request函数的配置参数类型
 * <ExtraExpand> - 如果指定，会用于扩展extraOption的类型, 当你想要自定义额外的配置时使用(如extraOption.token)
 * @param options - 配置
 * @return - Request实例
 * */
interface CreateInstance {
  <OPTIONS, ExtraExpand>(options: CreateOptions): Request;
}
```

<br>
<br>

#### options

`createInstance()` 接收的配置

```ts
// 特有配置
interface CreateOptions {
  /**
   * 请求适配器, 可以是任意接收配置并返回promise的函数
   * * 配置遵循BaseRequestOptions, 如果使用的请求库不符合这些字段名配置，可以通过此方法抹平
   * * 对于大多数请求库(fetch/axios)，只需要简单的透传options即可
   * */
  fetchAdapter?: (options: OPTIONS) => Promise<any>;
  /** 自定义缓存的获取方式，默认取全局下的localStorage.setItem (如果存在) */
  setStorageAdapter?: (key: string, val: any) => void;
  /** 自定义缓存的取值方式，默认取全局下的localStorage.getItem (如果存在) */
  getStorageAdapter?: (key: string) => any;
  /** 自定义缓存的清理方式 */
  removeStorageAdapter?: (key: string) => void;
  /** 传递给Request的默认配置，会在请求时深合并到请求配置中 */
  baseOptions?: Partial<OPTIONS>;
  /** 插件 */
  plugins?: Array<typeof Plugin>;
}

// 基础配置，支持在createInstance()和request()中配置，request()中的配置优先级大于前者
interface Options {
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求是否成功(只需要验证服务端的返回，状态码、超时等错误已自动处理) */
  checkStatus?(data: any): boolean;
  /** 用来从服务端请求中提取提示文本的字段 */
  messageField?: string;
  /** 配置反馈方式, 在此处通过Modal、Toast等提示库进行反馈提示 */
  feedBack?(
    message: string,
    status: boolean,
    extraOption: ExtraOptions,
    requestConfig: OPTIONS,
  ): void;
  /** 将response格式化为自己想要的格式后返回, 会在所有插件执行完毕后执行, 返回值为request接收的最终值  */
  format?(response: any, extraOption: ExtraOptions, requestConfig: OPTIONS): any;
  /** 请求开始, 可以进行show loading、添加headers头等操作 */
  start?(extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>): any;
  /**
   * 请求结束
   * * flag是start方法的返回值, 某些loading库会返回一个关闭表示，可以由此传递
   * */
  finish?(extraOption: ExtraOptions, requestConfig: OPTIONS, flag?: any): void;
}
```

<br>

<br>

### `request()`

```ts
/**
 * 请求方法, 返回一个必定resolve 元组[Error, Data]的Promise, 如果Error不为null则表示请求异常
 * 错误分为两种：
 *  1. 常规错误。跨域，网络错误、请求链接等错误，由fetchAdapter配置的请求库提供
 *  2. 服务器返回错误。状态码异常、checkStatus未通过等，此时Error对象会包含一个response属性，为服务器返回数据
 * */
export interface Request {
  <Data = any>(url: string, options?: OPTIONS): Promise<
    readonly [Error | RequestError | null, Data | null]
  >;
}

/**
 * request配置必须遵循的一些字段名
 * 一些配置字段需要在内部使用，所以通过此接口对配置进行简单约束
 * 例如，请求体必须以data或body字段传递，地址必须由url指定。
 * */
export interface BaseRequestOptions {
  /** 请求url */
  url?: string;
  /** 请求体, 该字段可以是data或body */
  data?: any;
  /** 请求体, 与data相同，用于在使用fetch时减少配置 */
  body?: any;
  /** 请求参数  */
  params?: any;
  /** 请求头 */
  headers?: any;
}
```

<br>

#### options

`request()` 的配置为创建实例时通过泛型指定的类型 + 一些内置的额外配置

**example**:

```ts
requset('/user', {
  methods: 'POST', // 这里是传递给请求器的配置
  extraOption: {
    // 这里是内部提供的额外配置
    useServeFeedBack: true,
    loading: '请求中...',
  },
});
```

```ts
interface ExtraOptions extends Options<any> {
  /**
   * 设置缓存时间，值为true时缓存30s，为数字时表示指定的秒数
   * ⛔ 不要对包含FormData或content-type不是application/json这类的的请求开启缓存
   * ✅ 需要缓存的一般都是查询类接口
   * */
  cache?: boolean | number;
  /** 为true时即使返回服务器状态码正确依然会以服务器返回的消息(根据serverMsgField配置项确定)作为反馈提示 */
  useServeFeedBack?: boolean;
  /** 静默模式，无论正确与否不会有任何提示 */
  quiet?: boolean;
  /** 默认会返回经过format处理的结果，为true时返回原始的response */
  plain?: boolean;
  /** 是否显示加载，需要在start/finish中接收并进行配置 */
  loading?: boolean | string;
  /** 自定义请求成功的提示, 启用此项时，不需要再配置useServeFeedBack。 会覆盖其他根据配置生成的提示消息 */
  successMessage?: string;
  /** 用于传递其他额外配置时，如 hasToken */
  [key: string]: any;
}

// 基础配置，支持在createInstance()和request()中配置，request()中的配置优先级大于前者
interface Options {
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求是否成功(只需要验证服务端的返回，状态码、超时等错误已自动处理) */
  checkStatus?(data: any): boolean;
  /** 用来从服务端请求中提取提示文本的字段 */
  messageField?: string;
  /** 配置反馈方式, 在此处通过Modal、Toast等提示库进行反馈提示 */
  feedBack?(
    message: string,
    status: boolean,
    extraOption: ExtraOptions,
    requestConfig: OPTIONS,
  ): void;
  /** 将response格式化为自己想要的格式后返回, 会在所有插件执行完毕后执行, 返回值为request接收的最终值  */
  format?(response: any, extraOption: ExtraOptions, requestConfig: OPTIONS): any;
  /** 请求开始, 可以进行show loading、添加headers头等操作 */
  start?(extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>): any;
  /**
   * 请求结束
   * * flag是start方法的返回值, 某些loading库会返回一个关闭表示，可以由此传递
   * */
  finish?(extraOption: ExtraOptions, requestConfig: OPTIONS, flag?: any): void;
}
```
