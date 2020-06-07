import { Plugin } from '../Plugin';
import statusCode from '../statusCode';
import { RequestError } from '../RequestError';

/** 在某些请求方法(fetch)中，即使出现404/500依然会走resolve，通过此方法自行限定错误范围 */
function checkResponseStatus(status: number) {
  return status >= 200 && status < 300;
}

/** 核心插件，用于完成各种配置对应的基础功能 */
export class CorePlugin extends Plugin<any> {
  before() {
    const start = this.getCurrentOption('start');

    this.ctx._corePlugin = {
      // 从返回、配置等提取出来的反馈信息
      message: '',
    };

    this.ctx._corePlugin.startFlag = start?.(this.extraOptions, this.options);
  }

  finish(): void {
    const finish = this.getCurrentOption('finish');

    finish?.(this.extraOptions, this.options, this.ctx._corePlugin.startFlag);
  }

  /** error不一定都为RequestError，任何包含response的error都视为RequestError, 如AxiosError */
  error(error: RequestError): void {
    const feedback = this.getCurrentOption('feedBack');
    /**
     * 取错误消息进行反馈, 顺序为:
     * 1. 根据messageField取服务器返回的错误提示消息
     * 2. 根据statusCode生成错误消息
     * 3. Error.message
     * 4. 未知错误
     * */
    if (!this.extraOptions.quiet && error && feedback) {
      const errMessage = error.message;

      /** 从服务器返回中取出的msg */
      let serverMsg: string = '';

      /** 根据服务器返回状态码获取的msg */
      let statusMsg: string = '';

      /** 包含response的内部错误 */
      if (error.response) {
        const { response } = error;
        const messageField = this.getCurrentOption('messageField');

        if (response) {
          serverMsg = response.data && response.data[messageField!];
          const _statusMsg = (statusCode as any)[response.status];
          if (_statusMsg) {
            statusMsg = `${response.status}: ${_statusMsg}`;
          }
        }
      }

      const finalMsg = serverMsg || statusMsg || errMessage || 'unknown error type';

      // 将Error对象的msg改为与反馈的msg一致, 方便使用
      error.message = finalMsg;

      feedback?.(finalMsg, false, this.extraOptions, this.options);
    }
  }

  /** 需要保证response中存在status(状态码)和data(返回) */
  pipe(response: any): any {
    const checkStatus = this.getCurrentOption('checkStatus');
    const serverMsgField = this.getCurrentOption('messageField');

    /**
     * 提示消息, 取值顺序为:
     * 1. 通过serverMsgField拿到的服务器响应
     * 2. 通过状态码匹配到的错误消息
     * 3. response中的statusText，fetch、axios等包含
     * 4. 默认错误信息
     * */
    const message =
      this.extraOptions.successMessage ||
      response.data?.[serverMsgField!] ||
      statusCode[response.status as keyof typeof statusCode] ||
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
  }

  success(): void {
    const extra = this.extraOptions;

    /** 请求成功，且设置了feedback和useServeFeedBack，使用message进行反馈 */
    if (!extra.quiet && (extra.useServeFeedBack || extra.successMessage)) {
      const { message } = this.ctx._corePlugin;
      const feedback = this.getCurrentOption('feedBack');

      feedback?.(message, true, extra, this.options);
    }
  }
}
