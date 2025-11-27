// API Configuration for YuntuCV
// 后端API配置文件

// 字段名中文映射表
const fieldNameMap = {
    'body.phone': '手机号',
    'body.password': '密码',
    'body.verification_code': '验证码',
    'body.username': '用户名',
    'body.sms_code': '短信验证码',
    'body.captcha': '图形验证码',
    'body.email': '邮箱',
    'unknown': '未知字段'
};

// 错误消息中文映射表
const errorMessageMap = {
    // 字段验证
    'Field required': '此项必填',
    'field required': '此项必填',

    // 手机号
    'Invalid phone number': '手机号格式不正确',
    'invalid phone': '手机号格式不正确',

    // 密码
    'String should have at least 6 characters': '至少需要6个字符',
    'password too short': '密码太短',
    'Incorrect username or password': '用户名或密码错误',
    'Incorrect password': '密码错误',
    'incorrect': '用户名或密码错误',

    // 用户
    'User already exists': '用户已存在',
    'user exists': '该手机号已被注册',

    // 验证码
    'Verification code is incorrect': '验证码错误',
    'Verification code has expired': '验证码已过期',
    'verification code': '验证码错误',
    'Invalid verification code': '验证码错误',

    // 网络
    'Failed to fetch': '网络连接失败',
    'Network error': '网络错误',
    'Network request failed': '网络请求失败'
};

// 翻译错误消息为中文
function translateErrorMessage(message) {
    if (!message) return message;

    // 尝试完全匹配
    if (errorMessageMap[message]) {
        return errorMessageMap[message];
    }

    // 尝试部分匹配（不区分大小写）
    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(errorMessageMap)) {
        if (lowerMessage.includes(key.toLowerCase())) {
            return value;
        }
    }

    return message;
}

// 翻译字段名为中文
function translateFieldName(fieldPath) {
    if (!fieldPath) return '未知字段';

    // 尝试完全匹配
    if (fieldNameMap[fieldPath]) {
        return fieldNameMap[fieldPath];
    }

    // 尝试匹配字段路径的最后一部分
    const parts = fieldPath.split('.');
    const lastPart = parts[parts.length - 1];

    for (const [key, value] of Object.entries(fieldNameMap)) {
        if (key.endsWith(lastPart)) {
            return value;
        }
    }

    return fieldPath;
}

// API基础URL配置
const API_CONFIG = {
    // 开发环境
    development: {
        baseURL: 'http://localhost:8000',
        apiVersion: 'v1'
    },
    // 测试环境（使用服务器IP，不需要SSL）
    testing: {
        baseURL: 'http://你的服务器IP:8000',  // 替换为实际IP，如 http://123.45.67.89:8000
        apiVersion: 'v1'
    },
    // 生产环境
    production: {
        baseURL: 'http://api.yuntucv.com',
        apiVersion: 'v1'
    }
};

// 环境切换管理
const EnvManager = {
    // 获取当前环境
    getCurrentEnv() {
        // 优先使用 localStorage 保存的环境
        const savedEnv = localStorage.getItem('api_environment');
        if (savedEnv && API_CONFIG[savedEnv]) {
            return savedEnv;
        }
        // 默认使用生产环境
        return 'production';
    },

    // 设置环境
    setEnvironment(env) {
        if (!API_CONFIG[env]) {
            console.error(`Invalid environment: ${env}`);
            return false;
        }
        localStorage.setItem('api_environment', env);
        console.log(`[ENV] 切换到 ${env} 环境:`, API_CONFIG[env].baseURL);

        // 刷新页面以应用新环境
        window.location.reload();
        return true;
    },

    // 获取环境名称
    getEnvName(env) {
        const names = {
            'development': '本地开发',
            'testing': '测试环境',
            'production': '生产环境'
        };
        return names[env] || env;
    }
};

// 当前环境
const ENV = EnvManager.getCurrentEnv();

// 获取当前环境配置
const currentConfig = API_CONFIG[ENV];

// 输出当前环境信息
console.log(`[API Config] 当前环境: ${ENV} (${EnvManager.getEnvName(ENV)})`);
console.log(`[API Config] API地址: ${currentConfig.baseURL}`);

// API基础路径
const BASE_URL = currentConfig.baseURL;
const API_BASE = `${BASE_URL}/api/${currentConfig.apiVersion}`;

// API端点配置
const API_ENDPOINTS = {
    // 认证相关
    auth: {
        sendCode: `${API_BASE}/auth/send-code`,
        register: `${API_BASE}/auth/register`,
        login: `${API_BASE}/auth/login`,
        refresh: `${API_BASE}/auth/refresh`,
        logout: `${API_BASE}/auth/logout`
    },
    // 用户相关
    user: {
        profile: `${API_BASE}/users/me`,
        updateProfile: `${API_BASE}/users/me`,
        balance: `${API_BASE}/users/balance`,
        recharge: `${API_BASE}/users/recharge`,
        transactions: `${API_BASE}/users/transactions`,
        bills: `${API_BASE}/users/bills`
    },
    // 上传任务相关
    uploadTasks: {
        list: `${API_BASE}/upload-tasks`,
        create: `${API_BASE}/upload-tasks`,
        detail: (taskId) => `${API_BASE}/upload-tasks/${taskId}`,
        files: (taskId) => `${API_BASE}/upload-tasks/${taskId}/files`,
        pause: (taskId) => `${API_BASE}/upload-tasks/${taskId}/pause`,
        resume: (taskId) => `${API_BASE}/upload-tasks/${taskId}/resume`,
        cancel: (taskId) => `${API_BASE}/upload-tasks/${taskId}/cancel`,
        delete: (taskId) => `${API_BASE}/upload-tasks/${taskId}`,
        stats: `${API_BASE}/upload-tasks/stats`
    },
    // 文件上传相关
    files: {
        // 批量检查文件（秒传检测）
        checkBatch: (taskId) => `${API_BASE}/upload-tasks/${taskId}/files/check`,
        // 小文件直接上传
        upload: (taskId, fileId) => `${API_BASE}/upload-tasks/${taskId}/files/${fileId}/upload`,
        // 分片上传
        initMultipart: (taskId, fileId) => `${API_BASE}/upload-tasks/${taskId}/files/${fileId}/multipart/init`,
        uploadChunk: (taskId, fileId) => `${API_BASE}/upload-tasks/${taskId}/files/${fileId}/multipart/upload`,
        completeMultipart: (taskId, fileId) => `${API_BASE}/upload-tasks/${taskId}/files/${fileId}/multipart/complete`,
        // 下载文件
        download: (taskId, filename) => `${API_BASE}/files/download/${taskId}/${filename}`
    },
    // 盘符相关
    drives: {
        list: `${API_BASE}/drives`,
        create: `${API_BASE}/drives`,
        detail: (driveId) => `${API_BASE}/drives/${driveId}`,
        stats: `${API_BASE}/drives/stats`
    }
};

// API请求封装类
class ApiClient {
    constructor() {
        this.baseURL = BASE_URL;
        this.apiBase = API_BASE;
        this.isRefreshing = false; // 刷新锁
        this.refreshPromise = null; // 刷新Promise,用于等待刷新完成
    }

    // 获取存储的token
    getAccessToken() {
        return localStorage.getItem('access_token');
    }

    // 获取刷新token
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    // 保存token
    saveTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        // 保存token获取时间,用于主动刷新判断
        localStorage.setItem('token_timestamp', Date.now().toString());
    }

    // 清除token
    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('token_timestamp');
    }

    // 保存用户信息
    saveUserInfo(userInfo) {
        localStorage.setItem('user_info', JSON.stringify(userInfo));
    }

    // 获取用户信息
    getUserInfo() {
        const userInfo = localStorage.getItem('user_info');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    // 检查token是否即将过期（提前10分钟刷新）
    shouldRefreshToken() {
        const tokenTimestamp = localStorage.getItem('token_timestamp');
        if (!tokenTimestamp) return false;

        const tokenAge = Date.now() - parseInt(tokenTimestamp);
        const TOKEN_EXPIRE_TIME = 120 * 60 * 1000; // 120分钟
        const REFRESH_THRESHOLD = 10 * 60 * 1000; // 提前10分钟刷新

        return tokenAge > (TOKEN_EXPIRE_TIME - REFRESH_THRESHOLD);
    }

    // 通用请求方法
    async request(url, options = {}) {
        // 检查是否需要主动刷新token
        if (!options.skipAuth && this.shouldRefreshToken() && this.getRefreshToken()) {
            console.log('[API] Token即将过期，主动刷新...');
            await this.refreshToken();
        }

        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // 添加认证token
        const accessToken = this.getAccessToken();
        if (accessToken && !options.skipAuth) {
            defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            // 处理服务端错误（5xx）
            if (response.status >= 500) {
                const error = new Error('服务器错误');
                error.isServerError = true;
                error.status = response.status;
                throw error;
            }

            const data = await response.json();

            if (!response.ok) {
                // 处理401未授权错误（token过期）
                if (response.status === 401 && !options.skipAuth) {
                    // 尝试刷新token
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        // 重试原请求
                        return this.request(url, options);
                    } else {
                        // 刷新失败，跳转到登录页
                        this.clearTokens();
                        window.location.href = '/auth.html';
                        const error = new Error('登录已过期，请重新登录');
                        error.status = 401;
                        throw error;
                    }
                }

                // 其他客户端错误（4xx）
                // Handle FastAPI validation errors (422)
                let errorMessage = '请求失败';

                if (data.detail) {
                    if (typeof data.detail === 'string') {
                        // 翻译字符串类型的错误消息
                        errorMessage = translateErrorMessage(data.detail);
                    } else if (Array.isArray(data.detail)) {
                        // FastAPI validation errors format - 翻译验证错误
                        errorMessage = data.detail.map(err => {
                            const fieldPath = err.loc ? err.loc.join('.') : 'unknown';
                            const fieldName = translateFieldName(fieldPath);
                            const message = translateErrorMessage(err.msg);
                            return `${fieldName}: ${message}`;
                        }).join('；');  // 使用中文分号
                    } else if (typeof data.detail === 'object') {
                        errorMessage = JSON.stringify(data.detail);
                    }
                } else if (data.message) {
                    // 翻译 message 字段的错误
                    const msg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
                    errorMessage = translateErrorMessage(msg);
                }

                const error = new Error(errorMessage);
                error.status = response.status;
                error.isServerError = false;
                error.validationErrors = Array.isArray(data.detail) ? data.detail : null;
                throw error;
            }

            return data;
        } catch (error) {
            // 网络错误或其他异常
            if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
                const networkError = new Error('网络连接失败，请检查网络');
                networkError.isServerError = true;
                console.error('API网络错误:', error);
                throw networkError;
            }

            console.error('API请求错误:', error);
            throw error;
        }
    }

    // GET请求
    async get(url, options = {}) {
        return this.request(url, {
            ...options,
            method: 'GET'
        });
    }

    // POST请求
    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(url, options = {}) {
        return this.request(url, {
            ...options,
            method: 'DELETE'
        });
    }

    // 刷新token（带并发控制）
    async refreshToken() {
        // 如果正在刷新,等待刷新完成
        if (this.isRefreshing && this.refreshPromise) {
            console.log('[API] Token刷新进行中,等待完成...');
            return this.refreshPromise;
        }

        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return false;
        }

        // 设置刷新锁
        this.isRefreshing = true;

        this.refreshPromise = (async () => {
            try {
                console.log('[API] 开始刷新Token...');
                const response = await fetch(API_ENDPOINTS.auth.refresh, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.saveTokens(data.access_token, data.refresh_token);
                    console.log('[API] Token刷新成功');
                    return true;
                } else {
                    console.error('[API] Token刷新失败:', response.status);
                    return false;
                }
            } catch (error) {
                console.error('[API] Token刷新异常:', error);
                return false;
            } finally {
                // 释放刷新锁
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    // 发送短信验证码
    async sendVerificationCode(phone) {
        return this.post(API_ENDPOINTS.auth.sendCode, { phone }, { skipAuth: true });
    }

    // 用户注册
    async register(userData) {
        const response = await this.post(API_ENDPOINTS.auth.register, userData, { skipAuth: true });

        // 保存token和用户信息
        this.saveTokens(response.access_token, response.refresh_token);
        this.saveUserInfo(response.user);

        return response;
    }

    // 用户登录
    async login(credentials) {
        const response = await this.post(API_ENDPOINTS.auth.login, credentials, { skipAuth: true });

        // 保存token和用户信息
        this.saveTokens(response.access_token, response.refresh_token);
        this.saveUserInfo(response.user);

        return response;
    }

    // 用户登出
    async logout() {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            try {
                await this.post(API_ENDPOINTS.auth.logout, { refresh_token: refreshToken });
            } catch (error) {
                console.error('登出请求失败:', error);
            }
        }

        // 清除本地存储
        this.clearTokens();
    }

    // 检查登录状态
    isLoggedIn() {
        return !!this.getAccessToken();
    }

    // 获取任务文件列表
    async getTaskFiles(taskId) {
        return this.get(window.API_ENDPOINTS.uploadTasks.files(taskId));
    }
}

// 创建全局API客户端实例
const apiClient = new ApiClient();

// 导出配置和实例
window.API_CONFIG = API_CONFIG;
window.API_ENDPOINTS = API_ENDPOINTS;
window.apiClient = apiClient;
window.EnvManager = EnvManager;
window.CURRENT_ENV = ENV;

// 确认导出成功
console.log('[API Config] Exports completed:', {
    EnvManager: !!window.EnvManager,
    CURRENT_ENV: window.CURRENT_ENV,
    apiClient: !!window.apiClient
});

// ==================== Windows客户端下载配置 ====================
// Windows客户端下载配置（Base64编码以防止爬虫直接抓取）
window.DOWNLOAD_CONFIG = {
    // Base64编码的OSS URL: https://oss-ssyt.oss-cn-hangzhou.aliyuncs.com/WindowsClient/yuntu-lastest.exe
    encodedUrl: 'aHR0cHM6Ly9vc3Mtc3N5dC5vc3MtY24taGFuZ3pob3UuYWxpeXVuY3MuY29tL1dpbmRvd3NDbGllbnQveXVudHUtbGFzdGVzdC5leGU=',
    displayFileName: '盛世云图客户端.exe'
};

// 初始化Windows客户端下载链接
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Download] 初始化Windows客户端下载链接...');

    const downloadBtn = document.getElementById('download-windows-client');
    if (downloadBtn) {
        try {
            // 解码Base64获取真实下载URL
            const downloadUrl = atob(window.DOWNLOAD_CONFIG.encodedUrl);

            // 设置下载链接和文件名
            downloadBtn.href = downloadUrl;
            downloadBtn.download = window.DOWNLOAD_CONFIG.displayFileName;

            console.log('[Download] Windows客户端下载已就绪');
            console.log('[Download] 下载文件名:', window.DOWNLOAD_CONFIG.displayFileName);
        } catch (error) {
            console.error('[Download] 初始化下载链接失败:', error);
            downloadBtn.href = '#';
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('下载链接配置错误，请联系客服');
            });
        }
    }
});
