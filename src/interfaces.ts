import { Plugin } from './Plugin';
import { RequestError } from './RequestError';

export type MixOpt<OPTIONS, ExtraExpand> = OPTIONS & {
  extraOption?: ExtraOptions<ExtraExpand>;
};

/** 基础配置，支持在createInstance和request.opt.extraOption中配置，后者优先级大于前者 */
export interface Options<OPTIONS, ExtraExpand> {
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求是否成功(状态码等在内部已处理，只需要关心服务器实际返回的data) */
  checkStatus?(data: any): boolean;
  /** 用来从服务端请求中提取提示文本的字段 */
  messageField?: string;
  /** 配置反馈方式 */
  feedBack?(
    message: string,
    status: boolean,
    extraOption: ExtraOptions<ExtraExpand>,
    requestConfig: MixOpt<OPTIONS, ExtraExpand>,
  ): void;
  /** 将response格式化为自己想要的格式后返回, 会在所有插件执行完毕后执行  */
  format?(
    response: any,
    extraOption: ExtraOptions<ExtraExpand>,
    requestConfig: MixOpt<OPTIONS, ExtraExpand>,
  ): any;
  /** 请求开始 */
  start?(extraOption: ExtraOptions<ExtraExpand>, requestConfig: MixOpt<OPTIONS, ExtraExpand>): any;
  /**
   * 请求结束
   * * flag是startRequest方法的返回值, 一般是从start中返回的loading等的关闭函数
   * */
  finish?(
    extraOption: ExtraOptions<ExtraExpand>,
    requestConfig: MixOpt<OPTIONS, ExtraExpand>,
    flag?: any,
  ): void;
}

/** 创建request实例时的配置 */
export interface CreateOptions<OPTIONS, ExtraExpand> extends Options<OPTIONS, ExtraExpand> {
  /**
   * 请求适配器, 可以是任意接收配置并返回promise的函数
   * * 配置遵循BaseRequestOptions, 如果使用的请求库不符合这些字段名配置，可以通过此方法抹平
   * * 对于大多数请求库(fetch/axios)，只需要简单的透传options即可
   * */
  fetchAdapter?: (options: MixOpt<OPTIONS, ExtraExpand>) => Promise<any>;
  /** 自定义缓存的获取方式，默认取全局下的localStorage.setItem (如果存在) */
  setStorageAdapter?: (key: string, val: any) => void;
  /** 自定义缓存的取值方式，默认取全局下的localStorage.getItem (如果存在) */
  getStorageAdapter?: (key: string) => any;
  /** 自定义缓存的清理方式 */
  removeStorageAdapter?: (key: string) => void;
  /** 传递给Request的默认配置，会在请求时深合并到请求配置中 */
  baseOptions?: Partial<MixOpt<OPTIONS, ExtraExpand>>;
  /** 插件 */
  plugins?: Array<typeof Plugin>;
}

/** OPTION中额外接收的配置 */
export type ExtraOptions<ExtraExpand> = Options<any, ExtraExpand> & {
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
  /** 自定义请求成功的提示, 启用此项时，不需要再配置useServeFeedBack，会覆盖其他根据配置生成的提示消息 */
  successMessage?: string;
  /** 用于传递其他额外配置时，如 hasToken */
  [key: string]: any;
} & ExtraExpand;

/**
 * 请求方法, 返回一个必定resolve 元组[Error, Data]的Promise, 如果Error不为null则表示请求异常
 * 错误分为两种：
 *  1. 常规错误。跨域，网络错误、请求链接等错误，由配置的fetchAdapter提供
 *  2. 服务器返回错误。状态码异常、checkStatus未通过等，此时Error对象会包含一个response属性，为服务器返回数据
 * */
export interface Request<OPTIONS, ExtraExpand> {
  <Data = any>(url: string, options?: MixOpt<OPTIONS, ExtraExpand>): Promise<
    readonly [Error | RequestError | null, Data | null]
  >;
  /** promise版本, 不想使用错误优先返回时使用 */
  promise: <Data = any>(url: string, options?: MixOpt<OPTIONS, ExtraExpand>) => Promise<Data>;
}

/**
 * request配置必须遵循的一些字段名
 * 一些配置字段需要在内部使用，所有通过此接口对配置进行简单约束
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

/**
 * 创建Request实例
 * <OPTIONS> - 创建的request函数的配置参数类型
 * <ExtraExpand> - 如果指定，会用于扩展extraOption的类型, 当你想要自定义额外的配置时使用(如extraOption.token)
 * @param options - 配置
 * @return - Request实例
 * */
export interface CreateInstance {
  <OPTIONS extends BaseRequestOptions, ExtraExpand = {}>(
    options: CreateOptions<OPTIONS, ExtraExpand>,
  ): Request<OPTIONS, ExtraExpand>;
}
