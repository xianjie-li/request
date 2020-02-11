import { AxiosRequestConfig, AxiosInstance } from 'axios';

interface extraOption {
  /** 设置缓存时间，值为true时缓存30s，为数字时表示指定的秒数。 */
  expirys: boolean | number
  /** 为true时即使返回状态码正确依然会以服务器返回的消息(根据serverMsgField配置项确定)作为反馈提示。 */
  useServeMsg: boolean
  /** 静默模式，无论正确与否不会有任何提示 */
  quiet: boolean
  /** 用原始的response代替经过format函数的response */
  plain: boolean
  /** 是否显示加载 */
  loading: boolean | string
  /** 用于传递其他额外配置时，如 hasToken */
  [key: string]: any;
}

 
interface CreateOptions {
  /** axios相关配置 */
  axiosBaseConfig?: AxiosRequestConfig
  /** 服务端返回的消息提示所在的属性名 */
  serverMsgField: string
  /** 接收服务器response，需要返回一个boolean值用于验证该次请求时候成功 */
  checkStatus(data: any): boolean
  /** 自定义反馈方式 */
  feedBack?(message: string, status: boolean, extraOption: extraOption): void
  /** 格式化response */
  formatResponse?(response: any): any
  /** 请求开始 */
  startRequest?(extraOption: extraOption, requestConfig: AxiosRequestConfig & { extraOption: extraOption }): any
  /** 请求结束, flag是startRequest方法的返回值 */
  finishRequest?(extraOption: extraOption, flag?: any): void
}

interface Request {
  (url: string, options?: AxiosRequestConfig & { extraOption?: Partial<extraOption> }): Promise<[any, any]>;
  axiosInstance: AxiosInstance;
}

export default function createRequest(options: CreateOptions): Request;
