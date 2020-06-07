<h1 align="center" style="color: #61dafb;">Request</h1>
<h1 align="center" style="font-size: 80px;color:#61dafb">💧</h1>
<p align="center">request is easy
</p>

<br>

<br>



## ✨features

* 几乎支持所有javascript运行时, 可以和任何请求库搭配使用
* 集中式的错误、操作反馈
* 全局loading、token等
* 请求缓存
* 插件化，可以通过插件来获取更多的能力



## 📦Installation

```
yarn add @lxjx/request
// or
npm install @lxjx/request
```



## 使用

### `axios`

使用`axios`与常规使用几乎没区别，只需要简单 配置`fetchAdapter` 并将`axios`配置类型传给`createInstance`即可

💡 如果使用js，忽略下面的所有类型声明

```ts
import axios, { AxiosRequestConfig } from 'axios'; // 安装axios

const request = createInstance<AxiosRequestConfig>({
  fetchAdapter(options) {
    return axios(options);
  },
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

// { name: string }是返回类型，默认为any
request<{ name: string }>('http://localhost:3000/user', {
  method: 'get', // 请求配置
  extraOption: { // 额外配置
    useServeFeedBack: true,
    loading: '请求中...',
  },
}).then(([err, res]) => {
  console.log('-----请求完成-----');
  console.log('err:', err);
  console.log('res:', res);

  // 当err存在时表示该次请求包含错误
  if (err || !res) return;

  // 在这里执行请求成功后的操作
});
```



<br>

<br>



### `fetch`

默认使用`fetch`进行请求，不需要配置`fetchAdapter`

💡 在低版本浏览器中需要安装`polyfill`

```ts
// RequestInit是fetch的配置对象类型, 如果使用js，忽略下面的所有类型声明即可
const request = createInstance<RequestInit>({
  // ...配置
});

// { name: string }是返回类型，默认为any
request<{ name: string }>('http://localhost:3000/user')
    .then(([err, res]) => {
      console.log('-----请求完成-----');
      console.log('err:', err);
      console.log('res:', res);

      // 当err存在时表示该次请求包含错误
      if (err || !res) return;

      // 在这里执行请求成功后的操作
    });
```



<br>

<br>



### `node`

在`node`中，依然推荐使用`axios`进行请求，直接采用上方配置。但是通常没必要使用。



<br>

<br>



###  **`小程序`**

通过配置`fetchAdapter`来支持小程序

```js
const request = createInstance({
    fetchAdapter(options) {
        return new Promise((res, rej) => {
            wx.request({
              ...options,
              success (response) {
                	res(response);
              },
              fail (error) {
              		rej(error);
              },
            })
        });
    },
    // 如果需要缓存， 添加以下配置 (由于小程序端不支持sessionStorage，不推荐进行缓存)
    setStorageAdapter(key, val) {
        wx.setStorageSync(key, val);
    },
    getStorageAdapter(key) {
        return wx.getStorageSync(key);
    },
    removeStorageAdapter(key) {
        wx.removeStorageSync(key);
    }
})

```



## 使用插件

request内部所有配置项、缓存等的功能都是由插件实现的，插件接口也对外提供，可以方便的进行功能扩展



插件为`Plugin` 类的子类，你可以通过重写不同的钩子来为插件实现不同的能力

```ts
class Plugin<OPTIONS extends BaseRequestOptions> {
  constructor(
    public ctx: any, // 在不同插件间共享数据的对象
    public createOptions: CreateOptions<OPTIONS>, // createInstance()传入的配置
    public options: MixOpt<OPTIONS>, // request()中传入的配置
    public extraOptions: ExtraOptions, // 等于options.extraOptions
  ) {}

  /**
   * 帮助函数，从extraOptions或createOptions中取出指定名称的方法，前者优先级更高
   * */
  getCurrentOption<key extends keyof Options<OPTIONS>>(optionField: key): Options<OPTIONS>[key] {
    return this.extraOptions[optionField] || this.createOptions[optionField];
  }

  /**
   * 请求开始之前
   * * 为此钩子返回一个Promise，可以阻断本次请求并以返回值作为request的返回
   * * 只要有任意一个before返回了值，其他钩子的before将不再执行
   * * 为了保证接口签名一致，最好返回与request返回一致且resolve的Promise对象
   * @example
      before() {
        return Promise.resolve([null, { tip: '这是一段直接从本地拉取的数据' }] as const);
      }
   * */
  before?(): Promise<readonly [null, any]> | void;

  /**
   * 转换请求结果并返回
   * @param response - response是根据你配置的请求库类型返回决定的
   * @return - 必须将经过处理后的response return，其他插件才能接受到经过处理后的response
   *
   * * 在转换过程中可以通过抛出错误来使该次请求'失败', 并进入catch
   * */
  pipe?(response: any): any;

  /**
   * 请求成功，对数据的处理请在pipe中执行，此函数只应用于进行消息反馈等
   * @param response - response是根据你配置的请求库类型决定的
   * */
  success?(response: any): void;

  /** 请求失败 */
  error?(error: Error | RequestError): void;

  /** 请求结束 */
  finish?(): void;
}
```



以`log` 插件为例

```ts
import { Plugin } from '@lxjx/request';

class Log extends Plugin {
  before() {
    console.log('请求开始啦');
  }

  pipe(response) {
    console.log('接收到response并正在进行处理');
    return response;
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
const request = createInstance({
    plugins: [Log], // 会在request进行的每个生命周期进行打印
	// ...其他配置
})
```





## API

### createInstance()

创建`Request`实例

```ts
/**
 * 创建Request实例
 * @generic OPTIONS - 创建的request函数的配置类型
 * @param options - 配置
 * @return - Request实例
 * */
export interface CreateInstance {
  <OPTIONS extends BaseRequestOptions>(options: CreateOptions<OPTIONS>): Request<OPTIONS>;
}

/**
 * request配置必须遵循的一些字段名
 * 一些配置字段需要在内部使用，所以通过此接口对配置进行简单约束
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



#### options

`createInstance()` 接收的配置

```ts
interface CreateOptions<OPTIONS extends BaseRequestOptions> extends Options<any> {
  /**
   * 请求适配器, 可以是任意接收配置并返回promise的函数
   * * 配置遵循BaseRequestOptions, 如果使用的请求库不符合这些字段名配置，可以通过此方法抹平
   * * 对于大多数请求库(fetch/axios)，只需要简单的透传options并返回即可
   * */
  fetchAdapter?: (options: MixOpt<OPTIONS>) => Promise<any>;
  /** 自定义缓存的获取方式，默认取全局下的localStorage.setItem (如果存在) */
  setStorageAdapter?: (key: string, val: any) => void;
  /** 自定义缓存的取值方式，默认取全局下的localStorage.getItem (如果存在) */
  getStorageAdapter?: (key: string) => any;
  /** 自定义缓存的清理方式 */
  removeStorageAdapter?: (key: string) => void;
  /** 传递给Request的默认配置，会在请求时深合并到请求配置中 */
  baseOptions?: Partial<MixOpt<OPTIONS>>;
  /** 插件 */
  plugins?: Array<typeof Plugin>;
}

// 基础配置，支持在createInstance和request中配置，后者优先级大于前者
interface Options<OPTIONS extends BaseRequestOptions> {
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求是否成功(状态码等在内部已处理，只需要关心服务器实际返回的data) */
  checkStatus?(data: any): boolean;
  /** 用来从服务端请求中提取提示文本的字段 */
  messageField?: string;
  /** 配置反馈方式 */
  feedBack?(
    message: string,
    status: boolean,
    extraOption: ExtraOptions,
    requestConfig: MixOpt<OPTIONS>,
  ): void;
  /** 将response格式化为自己想要的格式后返回, 会在所有插件执行完毕后执行  */
  format?(response: any, extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>): any;
  /** 请求开始 */
  start?(extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>): any;
  /**
   * 请求结束
   * * flag是startRequest方法的返回值, 一般是从start中返回的loading等的关闭函数
   * */
  finish?(extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>, flag?: any): void;
}
```



### request()

```ts
/**
 * 请求方法, 返回一个必定resolve 元组[Error, Data]的Promise, 如果Error不为null则表示请求异常
 * 错误分为两种：
 *  1. 常规错误。跨域，网络错误、请求链接等错误，由fetchAdapter配置的请求库提供
 *  2. 服务器返回错误。状态码异常、checkStatus未通过等，此时Error对象会包含一个response属性，为服务器返回数据
 * */
export interface Request<OPTIONS> {
  <Data = any>(url: string, options?: MixOpt<OPTIONS>): Promise<
    readonly [Error | RequestError | null, Data | null]
  >;
}
```



#### options

`request()` 的配置为创建实例时通过泛型指定的类型 + 一些额外配置

**example**:

```ts
requset('/user', {
    methods: 'POST', // 这里是传递给请求器的配置
    extraOption: { // 这里是内部提供的额外配置
        useServeFeedBack: true,
        loading: '请求中...',
    },
})
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

// 基础配置，支持在createInstance和request中配置，后者优先级大于前者
interface Options<OPTIONS extends BaseRequestOptions> {
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求是否成功(状态码等在内部已处理，只需要关心服务器实际返回的data) */
  checkStatus?(data: any): boolean;
  /** 用来从服务端请求中提取提示文本的字段 */
  messageField?: string;
  /** 配置反馈方式 */
  feedBack?(
    message: string,
    status: boolean,
    extraOption: ExtraOptions,
    requestConfig: MixOpt<OPTIONS>,
  ): void;
  /** 将response格式化为自己想要的格式后返回, 会在所有插件执行完毕后执行  */
  format?(response: any, extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>): any;
  /** 请求开始 */
  start?(extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>): any;
  /**
   * 请求结束
   * * flag是startRequest方法的返回值, 一般是从start中返回的loading等的关闭函数
   * */
  finish?(extraOption: ExtraOptions, requestConfig: MixOpt<OPTIONS>, flag?: any): void;
}
```













