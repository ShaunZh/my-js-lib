declare global {
  interface Window {
    wx: any; // 添加wx声明到window对象上，否则，调用window.wx会报错
  }
}

interface WxConfig {
  debug: boolean;

  appId: string;
  timestamp: string;
  nonceStr: string;
  signature: string;
  jsApiList: Array<string>;
}

interface WxLocation {
  code?: string;
}

// 用于声明不知道属性值的对象
interface WxSignatureResponse {
  code: number;
  result: WxConfig;
  message: string;
}

interface HttpResponse {
  code: number;
  result?: object;
  message: string;
}

interface AuthParams {
  signature: object;
  auth: object;
}

type PromiseFunc = <P>(params: P) => Promise<any>;
import LocationSearch from "./LocationSearch";

class SingletonWxAuth {
  private static _instance: SingletonWxAuth = new SingletonWxAuth();
  public static getInstance(): SingletonWxAuth {
    return SingletonWxAuth._instance;
  }
  private _isAuth = false; // 是否已经授权登录
  private _isWxsdkReady = false; //  微信sdk是否已准备

  // private _isWxBroswer: Boolean = false; // 是否为微信浏览器
  private _wxConfig: WxConfig = {
    debug: false,
    appId: undefined,
    timestamp: undefined,
    nonceStr: undefined,
    signature: undefined,
    jsApiList: [
      "chooseWXPay",
      "updateAppMessageShareData",
      "updateTimelineShareData", //
      "onMenuShareTimeline",
      "onMenuShareAppMessage", //
      "chooseImage",
      "previewImage",
      "uploadImage",
      "downloadImage", //
      "hideOptionMenu",
      "showOptionMenu", //
      "hideMenuItems",
      "showMenuItems", //
      "hideAllNonBaseMenuItem",
      "showAllNonBaseMenuItem",
      "closeWindow"
    ]
  }; // 通过微信sdk签名获取的微信配置

  private constructor() {
    if (SingletonWxAuth._instance) {
      throw new Error(
        "Error: Instantiation failed: Use SingletonWxAuth.getInstance() instead of new."
      );
    }
    SingletonWxAuth._instance = this;
  }

  public setWxApiList(apiList: string[]) {
    this._wxConfig.jsApiList = apiList;
  }

  public getWxApiList(): string[] {
    return this._wxConfig.jsApiList;
  }

  public getWxSdkStatus(): boolean {
    return this._isWxsdkReady;
  }

  public setWxDebug(debug: boolean) {
    this._wxConfig.debug = debug;
  }

  // 微信签名配置
  public wxSignatureConfig(): Promise<any> {
    return new Promise((resolve, reject) => {
      // TODO: 要验证此处是否需要添加在已经微信授权后才能进行jssdk签名
      if (this._isAuth) {
        // 是微信浏览器
        window.wx.config({
          debug: this._wxConfig.debug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
          appId: this._wxConfig.appId, // 必填，公众号的唯一标识
          timestamp: this._wxConfig.timestamp, // 必填，生成签名的时间戳
          nonceStr: this._wxConfig.nonceStr, // 必填，生成签名的随机串
          signature: this._wxConfig.signature, // 必填，签名
          // 必填，需要使用的JS接口列表
          jsApiList: this._wxConfig.jsApiList
        });
        window.wx.ready(() => {
          this._isWxsdkReady = true;
          resolve();
        });
        window.wx.error((err: HttpResponse) => {
          console.error("wx.config error");
          reject(err);
        });
      } else {
        resolve();
      }
    });
  }
  // 获取微信签名
  public httpGetWxSignature<P>(http: PromiseFunc, params: P): Promise<any> {
    if (this._wxConfig && this._wxConfig.appId) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      http(params)
        .then((res: WxSignatureResponse) => {
          const result: WxConfig = res.result;
          this._wxConfig.appId = result.appId;
          this._wxConfig.nonceStr = result.nonceStr;
          this._wxConfig.signature = result.signature;
          this._wxConfig.timestamp = result.timestamp;
          // 调用微信签名
          this.wxSignatureConfig()
            .then(() => {
              resolve();
            })
            .catch(err => {
              reject(err);
            });
        })
        .catch((err: HttpResponse) => {
          reject(err);
        });
    });
  }
  // 跳转到微信授权页面
  public wxAuthRedirect() {
    // console.log('redirectToWechatAuthUrl, _wxConfig.appId=' + _wxConfig.appId)
    // 要去掉本地的code和state参数
    const re = /(code=[A-Za-z0-9-=_]+&state=STATE[&]{0,1})/;
    let currentUrl = window.location.href.replace(re, "");
    currentUrl = currentUrl.replace("?#", "#");

    let url =
      "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" +
      this._wxConfig.appId +
      "&redirect_uri=" +
      encodeURIComponent(currentUrl) +
      "&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect";
    window.location.replace(url);
  }

  // 去除链接上面的code和STATE参数，跳转到项目地址
  public wxAuthLocationReplace() {
    // 去除code和state参数，然后跳转到页面地址
    const re = /(code=[A-Za-z0-9-=_]+&state=STATE[&]{0,1})/;
    let currentUrl = window.location.href.replace(re, "");
    currentUrl = currentUrl.replace("?#", "#");
    window.location.replace(currentUrl);
  }

  // 微信授权
  public wxAuth(
    httpSignature: PromiseFunc,
    httpAuth: PromiseFunc,
    authParams: AuthParams
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.httpGetWxSignature(httpSignature, authParams.signature)
        .then(() => {
          const searchObj: WxLocation = LocationSearch(window.location.search);
          if (searchObj["code"]) {
            httpAuth(authParams.auth)
              .then((authRes: HttpResponse) => {
                this._isAuth = true;
                this.wxAuthLocationReplace();
                resolve({
                  authStatus: "authSuccess",
                  authInfo: {
                    ...authRes
                  }
                });
              })
              .catch(err => {
                reject(err);
              });
          } else {
            if (this._isAuth) {
              resolve({
                authStatus: "authed"
              });
            } else {
              resolve({
                authStatus: "noAuth"
              });
            }
          }
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}

export default SingletonWxAuth;
