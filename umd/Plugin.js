(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Plugin = void 0;
    var Plugin = /** @class */ (function () {
        function Plugin(ctx, // 在不同插件间共享数据的对象
        createOptions, // 创建时配置
        options, // request中传入的配置
        extraOptions) {
            this.ctx = ctx;
            this.createOptions = createOptions;
            this.options = options;
            this.extraOptions = extraOptions;
        }
        /**
         * 帮助函数，从extraOptions或createOptions中取出指定名称的方法，前者优先级更高
         * */
        Plugin.prototype.getCurrentOption = function (optionField) {
            return this.extraOptions[optionField] || this.createOptions[optionField];
        };
        return Plugin;
    }());
    exports.Plugin = Plugin;
});
