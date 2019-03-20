import { stringify } from 'qs';
import request from '../utils/request';

/**
 * 基本格式
 * get: queryXXX
 * list: queryXxxList
 * post: 根据类型 (add|del|edit)XXX
 */

/* get */
export async function queryUser() {
  return request('/api/user/getinfo');
}

/**
 * 缓存
 * expirys: 值为true时缓存30s， typeof为number时缓存指定的秒数，单位s
 * */
export async function queryUserList() {
  return request('/api/user/getinfoList', {
    expirys: 5
  });
}

/* get + 单个参数 */
export async function getFakeCaptcha(mobile) {
  return request(`/api/captcha?mobile=${mobile}`);
}

/* get + 多个参数 */
export async function queryRule(params) {
  return request(`/api/rule?${stringify(params)}`);
}

/* post */
export async function addRule(body) {
  return request('/api/rule', {
    method: 'POST',
    body,
  });
}

/* params + body */
export async function addList(params) {
  const { count = 5, ...body } = params;
  return request(`/api/fake_list?count=${count}`, {
    method: 'POST',
    body,
  });
}