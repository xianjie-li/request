import { Plugin } from '../Plugin';
import { getCacheKeys } from './CacheBeforePlugin';

/**
 * 提供缓存能力
 * * 只在所有插件执行完成且依然没有错误时进行缓存, 所以钩子应该在所有钩子之后执行
 * * 在所有钩子之前执行兄弟钩子, 用于从缓存读取数据并阻断请求。
 * */
export class CachePlugin extends Plugin<any> {
  success(response: any): void {
    const cOptions = this.createOptions;
    const extra = this.options.extraOption || {};
    const format = this.getCurrentOption('format');

    let res = response;

    // 格式化返回值
    if (format && !extra.plain) {
      res = format(response, extra, this.options);
    }

    const { hashcode, skipCache } = this.ctx._cachePlugin;

    if (extra.cache && hashcode && !skipCache) {
      const [key, timeKey] = getCacheKeys(hashcode);

      cOptions.setStorageAdapter!(key, res);
      cOptions.setStorageAdapter!(timeKey, Date.now());
    }
  }
}
