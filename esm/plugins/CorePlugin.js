import { __extends } from "tslib";
import { Plugin } from '../Plugin';
import statusCode from '../statusCode';
import { RequestError } from '../RequestError';
/** 在某些请求方法(fetch)中，即使出现404/500依然会走resolve，通过此方法自行限定错误范围 */
function checkResponseStatus(status) {
    return status >= 200 && status < 300;
}
/** 核心插件，用于完成各种配置对应的基础功能 */
var CorePlugin = /** @class */ (function (_super) {
    __extends(CorePlugin, _super);
    function CorePlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CorePlugin.prototype.before = function () {
        var start = this.getCurrentOption('start');
        this.ctx._corePlugin = {
            // 从返回、配置等提取出来的反馈信息
            message: '',
        };
        this.ctx._corePlugin.startFlag = start === null || start === void 0 ? void 0 : start(this.extraOptions, this.options);
    };
    CorePlugin.prototype.finish = function () {
        var finish = this.getCurrentOption('finish');
        finish === null || finish === void 0 ? void 0 : finish(this.extraOptions, this.options, this.ctx._corePlugin.startFlag);
    };
    /** error不一定都为RequestError，任何包含response的error都视为RequestError, 如AxiosError */
    CorePlugin.prototype.error = function (error) {
        var feedback = this.getCurrentOption('feedBack');
        /**
         * 取错误消息进行反馈, 顺序为:
         * 1. 根据messageField取服务器返回的错误提示消息
         * 2. 根据statusCode生成错误消息
         * 3. Error.message
         * 4. 未知错误
         * */
        if (!this.extraOptions.quiet && error && feedback) {
            var errMessage = error.message;
            /** 从服务器返回中取出的msg */
            var serverMsg = '';
            /** 根据服务器返回状态码获取的msg */
            var statusMsg = '';
            /** 包含response的内部错误 */
            if (error.response) {
                var response = error.response;
                var messageField = this.getCurrentOption('messageField');
                if (response) {
                    serverMsg = response.data && response.data[messageField];
                    var _statusMsg = statusCode[response.status];
                    if (_statusMsg) {
                        statusMsg = response.status + ": " + _statusMsg;
                    }
                }
            }
            var finalMsg = serverMsg || statusMsg || errMessage || 'unknown error type';
            // 将Error对象的msg改为与反馈的msg一致, 方便使用
            error.message = finalMsg;
            feedback === null || feedback === void 0 ? void 0 : feedback(finalMsg, false, this.extraOptions, this.options);
        }
    };
    /** 需要保证response中存在status(状态码)和data(返回) */
    CorePlugin.prototype.pipe = function (response) {
        var _a;
        var checkStatus = this.getCurrentOption('checkStatus');
        var serverMsgField = this.getCurrentOption('messageField');
        /**
         * 提示消息, 取值顺序为:
         * 1. 通过serverMsgField拿到的服务器响应
         * 2. 通过状态码匹配到的错误消息
         * 3. response中的statusText，fetch、axios等包含
         * 4. 默认错误信息
         * */
        var message = this.extraOptions.successMessage || ((_a = response.data) === null || _a === void 0 ? void 0 : _a[serverMsgField]) ||
            statusCode[response.status] ||
            response.statusText ||
            '请求异常';
        this.ctx._corePlugin.message = message;
        /** 如果包含status，将其视为http状态码并进行检查 */
        if ('status' in response && !checkResponseStatus(response.status)) {
            throw new RequestError(message, response);
        }
        /** 通过配置的`checkStatus`检测服务器返回是否符合用户预期, 检测为false时抛出异常 */
        if (checkStatus && response.data && !checkStatus(response.data)) {
            throw new RequestError(message, response);
        }
        return response;
    };
    CorePlugin.prototype.success = function () {
        var extra = this.extraOptions;
        /** 请求成功，且设置了feedback和useServeFeedBack，使用message进行反馈 */
        if (!extra.quiet && (extra.useServeFeedBack || extra.successMessage)) {
            var message = this.ctx._corePlugin.message;
            var feedback = this.getCurrentOption('feedBack');
            feedback === null || feedback === void 0 ? void 0 : feedback(message, true, extra, this.options);
        }
    };
    return CorePlugin;
}(Plugin));
export { CorePlugin };
