interface AnyObj {
  [key: string]: any
}

export interface extraOption {
  expirys: boolean | number
  useServeMsg: boolean
  quiet: boolean
  plain: boolean
}

export interface CreateOptions {
  axiosBaseConfig?: AnyObj
  serverMsgField: string
  checkStatus(data: AnyObj): boolean
  feedBack?(message: string, status: boolean, extraOption: extraOption): void
  formatResponse?(response: AnyObj): any
  startRequest?(extraOption: extraOption, requestConfig: AnyObj): any
  startRequest?(extraOption: extraOption, flag: any): void
}

export interface Request {
  (url: string, options: AnyObj): Promise<any[]>
}

export default function createRequest(options: CreateOptions): Request;
