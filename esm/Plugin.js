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
export { Plugin };
