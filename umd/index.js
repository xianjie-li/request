(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "lodash/defaultsDeep", "@lxjx/utils", "./default", "./plugins/CacheBeforePlugin", "./plugins/CorePlugin", "./plugins/CachePlugin", "./Plugin"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var defaultsDeep_1 = tslib_1.__importDefault(require("lodash/defaultsDeep"));
    var utils_1 = require("@lxjx/utils");
    var default_1 = require("./default");
    var CacheBeforePlugin_1 = require("./plugins/CacheBeforePlugin");
    var CorePlugin_1 = require("./plugins/CorePlugin");
    var CachePlugin_1 = require("./plugins/CachePlugin");
    var createInstance = function (createOptions) {
        // 创建时配置
        var cOpt = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, default_1.defaultCreateConfig), createOptions), { plugins: tslib_1.__spreadArrays([CacheBeforePlugin_1.CacheBeforePlugin, CorePlugin_1.CorePlugin], (createOptions.plugins || []), [CachePlugin_1.CachePlugin]) });
        var baseOptions = cOpt.baseOptions;
        var request = function (url, optionsArg) {
            var _a;
            // 请求时配置
            var options = defaultsDeep_1.default({
                url: url,
            }, optionsArg, baseOptions, {
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                },
            });
            // 额外配置
            var extra = options.extraOption || {};
            var ctx = {};
            var format = extra.format || cOpt.format;
            var plugins = cOpt.plugins.map(function (Plugin) {
                return new Plugin(ctx, cOpt, options, extra);
            });
            /* ======== before ======= */
            for (var _i = 0, plugins_1 = plugins; _i < plugins_1.length; _i++) {
                var plugin = plugins_1[_i];
                var returns = (_a = plugin.before) === null || _a === void 0 ? void 0 : _a.call(plugin);
                if (returns) {
                    return returns;
                }
            }
            return (cOpt.fetchAdapter(options)
                /* ======== 预处理 ======= */
                .then(function (response) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
                var _a;
                return tslib_1.__generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(!utils_1.isObject(response.data) && typeof response.json === 'function')) return [3 /*break*/, 2];
                            _a = response;
                            return [4 /*yield*/, response.json()];
                        case 1:
                            _a.data = _b.sent();
                            _b.label = 2;
                        case 2: return [2 /*return*/, response];
                    }
                });
            }); })
                /* ======== pipe ======= */
                .then(function (response) {
                return plugins.reduce(function (prev, plugin) {
                    if ('pipe' in plugin) {
                        // pipe不存在时直接返回上一个response
                        return plugin.pipe ? plugin.pipe(prev) : prev;
                    }
                    return prev;
                }, response);
            })
                /* ======== success ======= */
                .then(function (response) {
                plugins.forEach(function (plugin) {
                    var _a;
                    (_a = plugin.success) === null || _a === void 0 ? void 0 : _a.call(plugin, response);
                });
                var res = response;
                // 格式化返回
                if (format && !extra.plain) {
                    res = format(response, extra, options);
                }
                return [null, res];
            })
                /* ======== error ======= */
                .catch(function (error) {
                plugins.forEach(function (plugin) {
                    var _a;
                    (_a = plugin.error) === null || _a === void 0 ? void 0 : _a.call(plugin, error);
                });
                return [error, null];
            })
                /* ======== finish ======= */
                .finally(function () {
                plugins.forEach(function (plugin) {
                    var _a;
                    (_a = plugin.finish) === null || _a === void 0 ? void 0 : _a.call(plugin);
                });
            }));
        };
        return request;
    };
    exports.default = createInstance;
    tslib_1.__exportStar(require("./Plugin"), exports);
});
