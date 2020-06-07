import { BaseRequestOptions, CreateOptions, ExtraOptions, MixOpt, Options } from './interfaces';
import { RequestError } from './RequestError';
export declare class Plugin<OPTIONS extends BaseRequestOptions> {
    ctx: any;
    createOptions: CreateOptions<OPTIONS>;
    options: MixOpt<OPTIONS>;
    extraOptions: ExtraOptions;
    constructor(ctx: any, // 在不同插件间共享数据的对象
    createOptions: CreateOptions<OPTIONS>, // 创建时配置
    options: MixOpt<OPTIONS>, // request中传入的配置
    extraOptions: ExtraOptions);
    /**
     * 帮助函数，从extraOptions或createOptions中取出指定名称的方法，前者优先级更高
     * */
    getCurrentOption<key extends keyof Options<OPTIONS>>(optionField: key): Options<OPTIONS>[key];
    /**
     * 请求开始之前
     * * 为此钩子返回一个Promise，可以阻断本次请求并以返回值作为request的返回
     * * 只要有任意一个before返回了值，其他钩子的before将不再执行
     * * 为了保证接口签名一致，最好返回与request返回一致且resolve的Promise对象
     * @example
        before() {
          return Promise.resolve([null, { tip: '这是一段直接从本地拉取的数据' }] as const);
        }
     * */
    before?(): Promise<readonly [null, any]> | void;
    /**
     * 转换请求结果并返回
     * @param response - response是根据你配置的请求库类型返回决定的
     * @return - 必须将经过处理后的response return，其他插件才能接受到经过处理后的response
     *
     * * 在转换过程中可以通过抛出错误来使该次请求'失败', 并进入catch
     * */
    pipe?(response: any): any;
    /**
     * 请求成功，对数据的处理请在pipe中执行，此函数只应用于进行消息反馈等
     * @param response - response是根据你配置的请求库类型决定的
     * */
    success?(response: any): void;
    /** 请求失败 */
    error?(error: Error | RequestError): void;
    /** 请求结束 */
    finish?(): void;
}
