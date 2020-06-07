(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestError = void 0;
    var tslib_1 = require("tslib");
    /** 标准错误格式, 当收到请求但请求失败时，包含response */
    var RequestError = /** @class */ (function (_super) {
        tslib_1.__extends(RequestError, _super);
        function RequestError(message, response) {
            var _this = _super.call(this, message) || this;
            _this.response = response;
            return _this;
        }
        return RequestError;
    }(Error));
    exports.RequestError = RequestError;
});
