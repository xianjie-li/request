import { Plugin } from '../Plugin';
/** 获取用于缓存的key */
export declare function getCacheKeys(hash: string): [string, string];
/**
 * 提供缓存能力
 * 缓存插件分为两处实现, CacheBeforePlugin.ts / CachePlugin.ts
 * * `CachePlugin.ts` 在所有插件执行完成且依然没有错误时进行缓存, 该钩子在所有钩子之后执行
 * * `CacheBeforePlugin.ts` 在所有钩子之前执行, 用于从缓存读取数据并阻断请求
 * */
export declare class CacheBeforePlugin extends Plugin<any> {
    before(): Promise<readonly [null, any]> | undefined;
}
