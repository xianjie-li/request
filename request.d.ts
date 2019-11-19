import { AxiosRequestConfig, AxiosInstance } from 'axios';

interface AnyObj {
  [key: string]: any
}

interface extraOption {
  /** 设置缓存时间，值为true时缓存30s，为数字时表示指定的秒数。 */
  expirys: boolean | number
  /** 为true时即使返回状态码正确依然会以服务器返回的消息(根据serverMsgField配置项确定)作为反馈提示。 */
  useServeMsg: boolean
  /** 静默模式，无论正确与否不会有任何提示 */
  quiet: boolean
  /** 用原始的response代替经过format函数的response */
  plain: boolean
}


interface CreateOptions {
  axiosBaseConfig?: AxiosRequestConfig

  /* 服务端约定配置 */
  serverMsgField: string // 服务端返回的消息提示所在的属性名
  checkStatus(data: AnyObj): boolean

  feedBack?(message: string, status: boolean, extraOption: extraOption): void
  formatResponse?(response: AnyObj): any
  startRequest?(extraOption: extraOption, requestConfig: AxiosRequestConfig & { extraOption: extraOption }): any
  finishRequest?(extraOption: extraOption, flag?: any): void
}

interface Request {
  (url: string, options: AxiosRequestConfig & { extraOption: extraOption }): Promise<[any, any]>;
  axiosInstance: AxiosInstance;
}

export default function createRequest(options: CreateOptions): Request;
