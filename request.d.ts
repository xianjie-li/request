export interface extraOption {
  expirys: boolean | number
  useServeMsg: boolean
  quiet: boolean
  plain: boolean
}

export interface CreateOptions {
  axiosBaseConfig?: object
  serverMsgField: string
  checkStatus(data: object): boolean
  feedBack?(message: string, status: boolean, extraOption: extraOption): void
  formatResponse?(response: object): any
  startRequest?(extraOption: extraOption, requestConfig: object): any
  startRequest?(extraOption: extraOption, flag: any): void
};

export function requset(url: string, options: object): Promise;

export default function createRequest(options: CreateOptions): request;