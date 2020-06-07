import { __rest } from "tslib";
import { dumpFn } from '@lxjx/utils';
export var defaultCreateConfig = {
    fetchAdapter: function (_a) {
        var url = _a.url, options = __rest(_a, ["url"]);
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
    feedBack: dumpFn,
    format: function (res) { return res; },
    start: dumpFn,
    finish: dumpFn,
};
