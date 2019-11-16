import { AxiosRequestConfig, AxiosInstance } from 'axios';

interface AnyObj {
  [key: string]: any
}

interface extraOption {
  expirys: boolean | number
  useServeMsg: boolean
  quiet: boolean
  plain: boolean
}

interface CreateOptions {
  axiosBaseConfig?: AxiosRequestConfig

  /* 服务端约定配置 */
  serverMsgField: string // 服务端返回的消息提示所在的属性名
  checkStatus(data: AnyObj): boolean

  feedBack?(message: string, status: boolean, extraOption: extraOption): void
  formatResponse?(response: AnyObj): any
  startRequest?(extraOption: extraOption, requestConfig: AnyObj): any
  startRequest?(extraOption: extraOption, flag: any): void
}

interface Request {
  (url: string, options: AxiosRequestConfig & { extraOption: extraOption }): Promise<[any, any]>;
  axiosInstance: AxiosInstance;
}

export default function createRequest(options: CreateOptions): Request;
