import { AxiosRequestConfig, AxiosInstance } from 'axios';

/** request和全局配置中通用的配置,request中传递的组件及配置优先级最高 */
export interface BaseOptions {
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

/** 额外传递给axios的配置对象 */
export interface extraOption extends BaseOptions {
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

export interface CreateOptions extends BaseOptions {
  /** axios相关配置 */
  axiosBaseConfig?: AxiosRequestConfig;
}

/** 完整配置继承自axios */
export interface FullOptions extends AxiosRequestConfig {
  extraOption?: Partial<extraOption>;
}

/**
 * 用于请求的request函数
 * @param url - 请求地址
 * @param options - 配置项、与axios完全相同，除了添加额外的extraOption选项
 * @return 一个Promise，当resolve时，会得到一个错误优先的数组 [error, data]
 * @static axiosInstance - axios实例
 * @static common - 常规的Promise版本request，不返回错误优先数组而是常规Promise对象
 * */
export interface Request {
  <Data = any>(url: string, options?: FullOptions): Promise<[any, Data]>;
  axiosInstance: AxiosInstance;
  common: <Data = any>(url: string, options?: FullOptions) => Promise<Data>;
}

export default function createRequest(options: CreateOptions): Request;
