(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "../Plugin", "./CacheBeforePlugin"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachePlugin = void 0;
    var tslib_1 = require("tslib");
    var Plugin_1 = require("../Plugin");
    var CacheBeforePlugin_1 = require("./CacheBeforePlugin");
    /**
     * 提供缓存能力
     * * 只在所有插件执行完成且依然没有错误时进行缓存, 所以钩子应该在所有钩子之后执行
     * * 在所有钩子之前执行兄弟钩子, 用于从缓存读取数据并阻断请求。
     * */
    var CachePlugin = /** @class */ (function (_super) {
        tslib_1.__extends(CachePlugin, _super);
        function CachePlugin() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CachePlugin.prototype.success = function (response) {
            var cOptions = this.createOptions;
            var extra = this.options.extraOption || {};
            var format = this.getCurrentOption('format');
            var res = response;
            // 格式化返回值
            if (format && !extra.plain) {
                res = format(response, extra, this.options);
            }
            var _a = this.ctx._cachePlugin, hashcode = _a.hashcode, skipCache = _a.skipCache;
            if (extra.cache && hashcode && !skipCache) {
                var _b = CacheBeforePlugin_1.getCacheKeys(hashcode), key = _b[0], timeKey = _b[1];
                cOptions.setStorageAdapter(key, res);
                cOptions.setStorageAdapter(timeKey, Date.now());
            }
        };
        return CachePlugin;
    }(Plugin_1.Plugin));
    exports.CachePlugin = CachePlugin;
});
