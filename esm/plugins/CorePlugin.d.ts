import { Plugin } from '../Plugin';
import { RequestError } from '../RequestError';
/** 核心插件，用于完成各种配置对应的基础功能 */
export declare class CorePlugin extends Plugin<any> {
    before(): void;
    finish(): void;
    /** error不一定都为RequestError，任何包含response的error都视为RequestError, 如AxiosError */
    error(error: RequestError): void;
    /** 需要保证response中存在status(状态码)和data(返回) */
    pipe(response: any): any;
    success(): void;
}
