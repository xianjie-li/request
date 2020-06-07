(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@lxjx/utils"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultCreateConfig = void 0;
    var tslib_1 = require("tslib");
    var utils_1 = require("@lxjx/utils");
    exports.defaultCreateConfig = {
        fetchAdapter: function (_a) {
            var url = _a.url, options = tslib_1.__rest(_a, ["url"]);
            return fetch(url, options);
        },
        setStorageAdapter: function (key, val) {
            sessionStorage.setItem(key, JSON.stringify(val));
        },
        getStorageAdapter: function (key) {
            var cache = sessionStorage.getItem(key);
            if (cache) {
                cache = JSON.parse(cache);
            }
            return cache;
        },
        removeStorageAdapter: function (key) {
            sessionStorage.removeItem(key);
        },
        feedBack: utils_1.dumpFn,
        format: function (res) { return res; },
        start: utils_1.dumpFn,
        finish: utils_1.dumpFn,
    };
});
