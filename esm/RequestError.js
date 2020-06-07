import { __extends } from "tslib";
/** 标准错误格式, 当收到请求但请求失败时，包含response */
var RequestError = /** @class */ (function (_super) {
    __extends(RequestError, _super);
    function RequestError(message, response) {
        var _this = _super.call(this, message) || this;
        _this.response = response;
        return _this;
    }
    return RequestError;
}(Error));
export { RequestError };
