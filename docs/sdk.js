
/**
 * 雪诺零信任SDK - 多因子认证系统
 * 用于在网页中实现零信任安全验证功能
 * 包含用户活动监听、token管理、MFA认证等核心功能
 */
var SnowSDK = function() {
    "use strict";

    // ==================== 工具函数模块 ====================

    /**
     * Object.assign 兼容性处理
     * 为不支持ES6的旧浏览器提供Object.assign功能
     */
    var objectAssign = function() {
        return Object.assign || function(target) {
            for (var source, index = 1, length = arguments.length; index < length; index++) {
                for (var key in source = arguments[index]) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
    };

    /**
     * 创建XMLHttpRequest对象
     * 兼容IE和现代浏览器
     */
    var createXHR = function() {
        return window.XMLHttpRequest ?
            new window.XMLHttpRequest :
            new ActiveXObject("Microsoft.XMLHTTP");
    };

    /**
     * 发送GET请求到零信任网关
     * @param {string} url - 请求URL
     * @param {function} callback - 成功回调函数
     */
    var sendGetRequest = function(url, callback) {
        // 从sessionStorage或window对象获取用户token
        var token = sessionStorage.getItem("snowtech__token") || window.snowtech_token;
        var baseUrl = sessionStorage.getItem("snowtech__baseUrl") || window.snowtech_baseUrl;
        var xhr = createXHR();

        xhr.open("GET", (baseUrl || "") + url, true);
        // 设置零信任MFA认证头，网关通过此头验证用户身份
        xhr.setRequestHeader("ztna-mfa-code", token || "");
        xhr.send();

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                var code = response.code;
                // 检查是否为需要处理的错误码
                var errorCodes = "500 617 618 695 698 699 694 695";
                var isError = errorCodes.indexOf(code + "") > -1;

                if (isError) {
                    // 显示错误页面，可能需要重新登录
                    SnowSDK.errorPage(code, isError);
                } else {
                    callback(response);
                }
            }

            if (xhr.readyState === 4 && xhr.status !== 200) {
                var status = xhr.status;
                // 检查是否需要重新登录的HTTP状态码
                var loginRequiredCodes = "410 617 618 698 699";
                var isLoginRequired = loginRequiredCodes.indexOf(status + "") > -1;
                SnowSDK.errorPage(status, isLoginRequired);
            }
        };
    };

    /**
     * 发送POST请求到零信任网关
     * @param {string} url - 请求URL
     * @param {object} data - 请求数据
     * @param {function} callback - 成功回调函数
     */
    var sendPostRequest = function(url, data, callback) {
        var token = sessionStorage.getItem("snowtech__token");
        var baseUrl = sessionStorage.getItem("snowtech__baseUrl");

        // 手动构建JSON字符串（兼容旧浏览器）
        var postData = "{";
        for (var key in data) {
            postData += '"' + key + '":' + data[key];
        }
        postData += "}";

        var xhr = createXHR();
        xhr.open("POST", (baseUrl || "") + url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        // 重要：每个请求都携带零信任认证token
        xhr.setRequestHeader("ztna-mfa-code", token || "");
        xhr.send(postData);

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                callback(response);
            }
        };
    };

    // ==================== 浏览器检测模块 ====================

    /**
     * 检测是否为IE浏览器
     * @param {boolean} checkAll - 是否检查所有IE版本
     * @returns {boolean}
     */
    var isIE = function(checkAll) {
        var userAgent = navigator.userAgent;
        if (checkAll) {
            return userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1;
        }
        // 只检查老版本IE
        return userAgent.indexOf("MSIE 8.0") > -1 || userAgent.indexOf("MSIE 7.0") > -1;
    };

    /**
     * 检测是否为移动设备
     * @returns {boolean}
     */
    var isMobile = function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    /**
     * 跨浏览器事件监听器
     * @param {Element} element - DOM元素
     * @param {string} eventType - 事件类型
     * @param {function} handler - 事件处理函数
     */
    var addEventHandler = function(element, eventType, handler) {
        if (isIE()) {
            // IE使用attachEvent方式
            var event = eventType === "input" ? "propertychange" : eventType;
            element.attachEvent("on" + event, handler);
        } else {
            // 现代浏览器使用addEventListener
            element.addEventListener(eventType, handler);
        }
    };

    /**
     * 防抖函数 - 限制函数调用频率
     * @param {function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @param {boolean} immediate - 是否立即执行
     */
    function debounce(func, delay, immediate) {
        var timer = null;
        return function() {
            var args = Array.prototype.slice.call(arguments);

            if (timer) clearTimeout(timer);

            if (immediate) {
                var callNow = !timer;
                timer = setTimeout(function() {
                    timer = null;
                }, delay);
                if (callNow) func.apply(null, args);
            } else {
                timer = setTimeout(function() {
                    func.apply(null, args);
                }, delay);
            }
        };
    }

    // ==================== 认证配置模块 ====================

    /**
     * 认证方式中文名称映射
     */
    var AuthMethodNames = {
        sms: "短信验证",
        email: "邮箱验证",
        otp: "动态令牌"
    };

    /**
     * MFA触发原因消息
     * 当用户触发多因子认证时显示的提示信息
     */
    var MFATriggerMessages = {
        602: "由于您的访问有可能对网站造成安全威胁，我们需要验证您的身份，确认是您本人在尝试访问。",
        603: "为了保证您的账号安全（上次登录地址：{location} - {ip}），我们需要验证您的身份，确认是您本人在尝试登录。",
        606: "由于您的终端存在安全风险，有可能对网站造成安全威胁，我们需要验证您的身份，确认是您本人在尝试访问。",
        607: "由于您未使用雪诺安全浏览器访问系统，我们需要验证您的身份，确认是您本人在尝试访问。",
        608: "由于您正在非允许时间访问系统，我们需要验证您的身份，确认是您本人在尝试访问。",
        609: "由于您正在非允许地区访问系统，我们需要验证您的身份，确认是您本人在尝试访问。",
        610: "由于未监测到您的设备健康状态，我们需要验证您的身份，确认是您本人在尝试访问。",
        611: "由于您未在飞书内访问系统，我们需要验证您的身份，确认是您本人在尝试访问。",
        612: "由于您未在企业微信内访问系统，我们需要验证您的身份，确认是您本人在尝试访问。"
    };

    /**
     * 系统错误消息
     * 当系统出现错误时显示的消息
     */
    var SystemErrorMessages = {
        617: "很抱歉，由于您的访问存在异常，您的会话已结束，请尝试重新登录。",
        618: "很抱歉，由于您的账号存在异常，您的会话已结束，请尝试重新登录。",
        698: "您已经被从其他设备强制下线，如非您本人操作请及时修改密码，或联系系统管理员处理。",
        699: "由于没有任何活动，您的会话已结束。请尝试重新登录。",
        500: "网络异常，请重试",
        694: "当前网关未正确配置双因素认证。请联系管理员进行配置，以确保您的账户安全。",
        695: "抱歉，您无法完成双因素认证，请确保您提供了正确的信息。"
    };

    // ==================== 主要SDK类 ====================

    /**
     * 雪诺零信任SDK主类
     * 负责整个MFA认证流程的管理
     */
    var SnowSDK = function() {

        /**
         * SDK构造函数
         * @param {object} options - 配置选项
         * @param {boolean} options.isBg - 是否显示背景
         * @param {number} options.duration - 自动检查间隔（秒）
         * @param {function} options.callback - 认证成功回调
         * @param {function} options.onClose - 关闭回调
         * @param {string} options.baseUrl - API基础URL
         * @param {string} options.token - 用户token
         */
        function SnowSDK(options) {
            // 默认配置
            this.options = {
                isBg: false,        // 是否显示背景效果
                duration: 3,        // 自动检查间隔（秒）
                unBind: false       // 是否解绑自动检查
            };

            // 认证数据结构
            this.data = {
                methods: [],        // 可用的认证方法列表
                error: 0,          // 错误码
                details: {}        // 错误详情
            };

            // 状态变量
            this.isNewPage = 0;     // 新页面标识
            this.isError = false;   // 错误状态
            this.currIndex = 0;     // 当前输入框索引
            this.isFocus = false;   // 是否聚焦状态

            // 验证码发送状态管理
            this.sendCodeData = {
                sms: {
                    stat: 0,  // 发送状态：0-未发送，1-已发送
                    tips: "请点击下面按钮获取验证码"
                },
                email: {
                    tips: "请点击下面按钮获取验证码",
                    stat: 0
                },
                otp: {
                    tips: "请输入雪诺移动客户端中令牌页面的动态口令",
                    stat: 0
                }
            };

            // 回调函数
            this.onSuccess = options?.callback;  // 认证成功回调
            this.onClose = options?.onClose;     // 对话框关闭回调

            // 初始化配置
            this.initializeOptions(options);
        }

        /**
         * 初始化SDK配置
         * @param {object} options - 配置选项
         */
        SnowSDK.prototype.initializeOptions = function(options) {
            if (options) {
                // 设置配置项
                this.options.unBind = options.unBind || false;
                this.options.isBg = options.isBg !== undefined ? options.isBg : this.options.isBg;
                this.options.duration = options.duration !== undefined ? options.duration : this.options.duration;
                this.isNewPage = options.duration === undefined ? 0 : options.duration;

                // 保存基础URL和token到sessionStorage和window对象
                // 这样可以在后续的API请求中使用
                if (options.baseUrl) {
                    sessionStorage.setItem("snowtech__baseUrl", options.baseUrl);
                    window.snowtech_baseUrl = options.baseUrl;
                }

                if (options.token) {
                    sessionStorage.setItem("snowtech__token", options.token);
                    window.snowtech_token = options.token;
                }
            }
        };

        /**
         * SDK初始化方法
         * 这是SDK的入口点，负责启动整个认证流程
         * @param {function} callback - 初始化完成回调
         */
        SnowSDK.prototype.init = function(callback) {
            var self = this;

            // 监听来自iframe的跨窗口消息
            // 当SDK在iframe中运行时，与父窗口通信
            window.addEventListener("message", function(event) {
                if (event.data.type === 200) {
                    // 收到MFA数据，开始处理认证流程
                    self.processData(event.data.data);
                }

                if (+event.data.type === 500) {
                    // 收到错误消息，显示错误页面
                    var errorData = event.data.data;
                    SnowSDK.errorPage(errorData.htmlCode, errorData.type);
                }
            }, false);

            // 页面卸载时清理token信息
            window.onunload = function() {
                delete window.snowtech_baseUrl;
                delete window.snowtech_token;
            };

            // 检查当前用户的MFA状态
            this.checkMFAState(function(response) {
                var data = response.data;

                if (data.trigger) {
                    // 需要触发MFA认证

                    // 如果在iframe中，发送消息给父窗口处理
                    if (window.top !== window.self) {
                        clearTimeout(self.autoCheckTimer);
                        window.top?.postMessage({ type: 200, data: data }, "*");
                        return;
                    }

                    // 在当前窗口处理MFA认证
                    self.processData(data);
                } else {
                    // 不需要MFA，重置状态
                    self.resetInit();

                    // 如果配置为0，则刷新页面
                    if (self.isNewPage === 0) {
                        location.reload();
                    }

                    // 执行完成回调
                    callback?.();
                }
            });

            // 启动可见性变化监听（用于自动检查）
            if (!this.options.unBind) {
                this.handleVisibilityChange();
            }

            // 处理移动端响应式布局
            this.handleResponsive();
        };

        /**
         * 检查用户MFA状态
         * 向零信任网关发送请求，检查是否需要MFA认证
         * @param {function} callback - 检查完成回调
         */
        SnowSDK.prototype.checkMFAState = function(callback) {
            // 调用网关API检查MFA状态
            sendGetRequest("/mfa/auth/state?client_type=pc", callback);
        };

        /**
         * 处理MFA认证数据
         * 解析网关返回的MFA配置，决定显示哪种认证方式
         * @param {object} data - MFA配置数据
         */
        SnowSDK.prototype.processData = function(data) {
            // 清除之前的自动检查定时器
            clearTimeout(this.autoCheckTimer);

            // 解析错误码和详细信息
            this.data.error = data.triggerDetails?.error_code || "";
            this.data.details = data.triggerDetails?.details || {};

            // 保存MFA状态
            if (data.triggerDetails?.mfa_state) {
                this.data.mfa_state = data.triggerDetails.mfa_state;
            }

            // 获取可用的认证方法
            this.data.methods = data.methods;

            // 如果没有选择认证方法，默认选择第一个
            if (!this.currentSelect && this.data?.methods?.[0]) {
                this.currentSelect = this.data.methods[0];
            }

            // 处理SSO或UKEY认证方式
            // 这些方式需要重定向到外部认证服务
            if (this.currentSelect?.name === "sso" ||
                this.currentSelect?.name?.toLowerCase() === "ukey") {
                this.handleRedirectAuth();
                return;
            }

            // 过滤掉重定向类型的认证方法
            this.data.methods = this.data.methods.filter(function(method) {
                return method.name !== "sso" && method.name.toLowerCase() !== "ukey";
            });

            // 创建MFA认证界面
            this.createInterface();
        };

        /**
         * 处理重定向认证（SSO/UKEY）
         * 获取重定向URL并跳转到外部认证服务
         */
        SnowSDK.prototype.handleRedirectAuth = function() {
            sendGetRequest("/mfa/auth/verify/redirect_url", function(response) {
                var redirectUrl = response.data;
                // 构建完整的重定向URL，包含返回地址
                location.href = redirectUrl + "?redirect_uri=" + encodeURIComponent(location.href);
            });
        };

        /**
         * 可见性变化处理
         * 监听窗口焦点变化，用于自动检查用户状态
         * 这是零信任连续验证的关键机制
         */
        SnowSDK.prototype.handleVisibilityChange = function() {
            var self = this;

            // 窗口获得焦点时立即检查
            addEventHandler(isIE() ? document : window, "focus", function() {
                self.autoCheck(true);  // 立即检查
            });

            // 窗口失去焦点时停止自动检查
            addEventHandler(isIE() ? document : window, "blur", function() {
                clearTimeout(self.autoCheckTimer);
            });
        };

        /**
         * 自动检查用户状态
         * 根据配置的时间间隔定期检查用户token状态
         * 这是实现零信任连续验证的核心机制
         * @param {boolean} immediate - 是否立即执行
         */
        SnowSDK.prototype.autoCheck = function(immediate) {
            var self = this;

            // 清除之前的定时器
            clearTimeout(this.autoCheckTimer);

            // 如果配置了检查间隔或需要立即执行
            if (this.options.duration || immediate) {
                var delay = immediate ? 0 : this.options.duration * 1000;

                // 设置新的检查定时器
                this.autoCheckTimer = setTimeout(function() {
                    // 重新初始化，检查用户状态
                    self.init(function() {
                        // 递归调用，持续检查
                        self.autoCheck();
                    });
                }, delay);
            }
        };

        /**
         * 重置SDK状态
         * 清理所有UI元素和状态数据
         */
        SnowSDK.prototype.resetInit = function() {
            // 清理背景元素
            var backgrounds = document.getElementsByClassName("snowtech-bg");
            if (backgrounds[0]) {
                backgrounds[0].remove();
            }

            // 清理静态引用
            SnowSDK.bg?.unmounted?.();
            SnowSDK.bg = undefined;

            SnowSDK.dialog?.unmounted?.(this);
            SnowSDK.dialog = undefined;

            // 重置数据状态
            this.currentSelect = null;
            this.data = { methods: [], error: 0, details: {} };
            this.sendCodeData = {
                sms: { stat: 0, tips: "请点击下面按钮获取验证码" },
                email: { tips: "请点击下面按钮获取验证码", stat: 0 },
                otp: { tips: "请输入雪诺移动客户端中令牌页面的动态口令", stat: 0 }
            };
            this.currIndex = 0;
        };

        /**
         * 静态方法：显示错误页面
         * @param {number} errorCode - 错误码
         * @param {boolean} needLogin - 是否需要重新登录
         */
        SnowSDK.errorPage = function(errorCode, needLogin) {
            if (window.top === window.self) {
                // 在主窗口中显示错误页面
                var sdk = new SnowSDK();
                if (!SnowSDK.bg) {
                    sdk.createBackground();
                }
                sdk.showErrorDialog(errorCode, needLogin);
            } else {
                // 在iframe中，发送消息给父窗口
                window.top?.postMessage({
                    type: 500,
                    data: { httpCode: errorCode, type: needLogin }
                }, "*");
            }
        };

        return SnowSDK;
    }();

    // 返回SDK构造函数
    return SnowSDK;
}();

/**
 * 使用说明：
 *
 * 1. 基本用法：
 *    new SnowSDK({
 *        baseUrl: '/snow-api',
 *        token: 'user-token',
 *        callback: function() { console.log('认证成功'); }
 *    }).init();
 *
 * 2. 主要功能：
 *    - 自动检查用户token状态
 *    - 监听用户活动（鼠标、键盘等）
 *    - 提供多种MFA认证方式（短信、邮箱、动态令牌）
 *    - 处理认证异常和错误
 *
 * 3. 零信任特性：
 *    - 连续验证：定期检查用户状态
 *    - 活动监听：监控用户操作
 *    - 动态认证：根据风险等级要求不同认证
 *    - 会话管理：自动处理token过期和刷新
 */