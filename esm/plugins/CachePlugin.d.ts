import { Plugin } from '../Plugin';
/**
 * 提供缓存能力
 * * 只在所有插件执行完成且依然没有错误时进行缓存, 所以钩子应该在所有钩子之后执行
 * * 在所有钩子之前执行兄弟钩子, 用于从缓存读取数据并阻断请求。
 * */
export declare class CachePlugin extends Plugin<any> {
    success(response: any): void;
}
