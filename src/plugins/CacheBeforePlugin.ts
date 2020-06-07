import { Plugin } from '../Plugin';
import hashFnv32a from '../hash';
import { defaultCreateConfig } from '../default';

/** 获取用于缓存的key */
export function getCacheKeys(hash: string): [string, string] {
  return [`CACHE:${hash}`, `CACHE:${hash}:timestamp`];
}

/**
 * 提供缓存能力
 * 缓存插件分为两处实现, CacheBeforePlugin.ts / CachePlugin.ts
 * * `CachePlugin.ts` 在所有插件执行完成且依然没有错误时进行缓存, 该钩子在所有钩子之后执行
 * * `CacheBeforePlugin.ts` 在所有钩子之前执行, 用于从缓存读取数据并阻断请求
 * */
export class CacheBeforePlugin extends Plugin<any> {
  before() {
    const extra = this.extraOptions;
    const { options } = this;
    const cOptions = this.createOptions;

    //  是否跳过缓存 (未配置StorageAdapter且不支持sessionStorage API, 跳过缓存
    const skipCache =
      cOptions.getStorageAdapter === defaultCreateConfig.getStorageAdapter &&
      typeof sessionStorage === 'undefined';

    this.ctx._cachePlugin = {
      /** 根据当前请求参数、url生成的唯一字符串 */
      fingerprint: null,
      /** 根据fingerprint生成hash */
      hashcode: null,
      /** 是否跳过缓存, CachePlugin依赖此值判断是否需要缓存 */
      skipCache,
    };

    if (extra.cache && !skipCache) {
      // 缓存时间
      const expiry = extra.cache && (typeof extra.cache === 'number' ? extra.cache : 30);

      // 根据主要入参生成请求签名/hash
      const fingerprint =
        (options.url || '') +
        JSON.stringify(options.data || {}) +
        JSON.stringify(options.body || {}) +
        JSON.stringify(options.params || {}) +
        JSON.stringify(options.headers || {});

      const hash = hashFnv32a(fingerprint);

      this.ctx._cachePlugin.fingerprint = fingerprint;
      this.ctx._cachePlugin.hashcode = hash;

      const [key, timeKey] = getCacheKeys(hash);

      /* 尝试取出匹配到的缓存数据 */
      const cached = cOptions.getStorageAdapter!(key);
      const cachedTime = cOptions.getStorageAdapter!(timeKey);

      if (cached && cachedTime) {
        // 到缓存结束时间差值
        const age = (Date.now() - +cachedTime) / 1000;

        if (age < expiry) {
          // 添加isCache标记
          if (cached instanceof Object) {
            cached._isCache = true;
          }

          return Promise.resolve([null, cached] as const);
        }
        cOptions.removeStorageAdapter!(key);
        cOptions.removeStorageAdapter!(timeKey);
      }
    }
  }
}
