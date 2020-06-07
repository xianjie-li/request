/** 标准错误格式, 当收到请求但请求失败时，包含response */
export class RequestError extends Error {
  constructor(message?: string, public response?: any) {
    super(message);
  }
}
