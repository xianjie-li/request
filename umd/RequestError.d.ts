/** 标准错误格式, 当收到请求但请求失败时，包含response */
export declare class RequestError extends Error {
    response?: any;
    constructor(message?: string, response?: any);
}
