(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "../Plugin", "../hash", "../default"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CacheBeforePlugin = exports.getCacheKeys = void 0;
    var tslib_1 = require("tslib");
    var Plugin_1 = require("../Plugin");
    var hash_1 = tslib_1.__importDefault(require("../hash"));
    var default_1 = require("../default");
    /** 获取用于缓存的key */
    function getCacheKeys(hash) {
        return ["CACHE:" + hash, "CACHE:" + hash + ":timestamp"];
    }
    exports.getCacheKeys = getCacheKeys;
    /**
     * 提供缓存能力
     * 缓存插件分为两处实现, CacheBeforePlugin.ts / CachePlugin.ts
     * * `CachePlugin.ts` 在所有插件执行完成且依然没有错误时进行缓存, 该钩子在所有钩子之后执行
     * * `CacheBeforePlugin.ts` 在所有钩子之前执行, 用于从缓存读取数据并阻断请求
     * */
    var CacheBeforePlugin = /** @class */ (function (_super) {
        tslib_1.__extends(CacheBeforePlugin, _super);
        function CacheBeforePlugin() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CacheBeforePlugin.prototype.before = function () {
            var extra = this.extraOptions;
            var options = this.options;
            var cOptions = this.createOptions;
            //  是否跳过缓存 (未配置StorageAdapter且不支持sessionStorage API, 跳过缓存
            var skipCache = cOptions.getStorageAdapter === default_1.defaultCreateConfig.getStorageAdapter &&
                typeof sessionStorage === 'undefined';
            this.ctx._cachePlugin = {
                /** 根据当前请求参数、url生成的唯一字符串 */
                fingerprint: null,
                /** 根据fingerprint生成hash */
                hashcode: null,
                /** 是否跳过缓存, CachePlugin依赖此值判断是否需要缓存 */
                skipCache: skipCache,
            };
            if (extra.cache && !skipCache) {
                // 缓存时间
                var expiry = extra.cache && (typeof extra.cache === 'number' ? extra.cache : 30);
                // 根据主要入参生成请求签名/hash
                var fingerprint = (options.url || '') +
                    JSON.stringify(options.data || {}) +
                    JSON.stringify(options.body || {}) +
                    JSON.stringify(options.params || {}) +
                    JSON.stringify(options.headers || {});
                var hash = hash_1.default(fingerprint);
                this.ctx._cachePlugin.fingerprint = fingerprint;
                this.ctx._cachePlugin.hashcode = hash;
                var _a = getCacheKeys(hash), key = _a[0], timeKey = _a[1];
                /* 尝试取出匹配到的缓存数据 */
                var cached = cOptions.getStorageAdapter(key);
                var cachedTime = cOptions.getStorageAdapter(timeKey);
                if (cached && cachedTime) {
                    // 到缓存结束时间差值
                    var age = (Date.now() - +cachedTime) / 1000;
                    if (age < expiry) {
                        // 添加isCache标记
                        if (cached instanceof Object) {
                            cached._isCache = true;
                        }
                        return Promise.resolve([null, cached]);
                    }
                    cOptions.removeStorageAdapter(key);
                    cOptions.removeStorageAdapter(timeKey);
                }
            }
        };
        return CacheBeforePlugin;
    }(Plugin_1.Plugin));
    exports.CacheBeforePlugin = CacheBeforePlugin;
});
