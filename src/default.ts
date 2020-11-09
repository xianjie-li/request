import { dumpFn } from '@lxjx/utils';
import { BaseRequestOptions, CreateOptions } from './interfaces';

export const defaultCreateConfig: Partial<CreateOptions<BaseRequestOptions, any>> = {
  fetchAdapter: ({ url, ...options }: any) => fetch(url, options),
  setStorageAdapter(key, val) {
    sessionStorage.setItem(key, JSON.stringify(val));
  },
  getStorageAdapter(key) {
    let cache = sessionStorage.getItem(key);
    if (cache) {
      cache = JSON.parse(cache);
    }

    return cache;
  },
  removeStorageAdapter(key) {
    sessionStorage.removeItem(key);
  },
  feedBack: dumpFn,
  format: res => res,
  start: dumpFn,
  finish: dumpFn,
};
