/**
 * 微信登录模块
 * 支持 PC 端扫码登录和 H5 端授权登录
 */

class WechatLogin {
    constructor() {
        this.apiBase = window.apiClient.apiBase;
        this.pollTimer = null;
        this.sceneStr = null;
        this.sessionToken = null;
        this.qrCodeUrl = null;
        this.expiresIn = 300; // 默认 5 分钟
    }

    /**
     * 检测设备类型
     */
    detectDeviceType() {
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
        return isMobile ? 'mobile' : 'pc';
    }

    /**
     * 生成微信登录二维码
     */
    async generateQRCode() {
        try {
            const deviceType = this.detectDeviceType();

            const response = await fetch(`${this.apiBase}/wechat/qrcode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    device_type: deviceType
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '生成二维码失败');
            }

            const data = await response.json();
            this.sceneStr = data.scene_str;
            this.qrCodeUrl = data.qr_code_url;
            this.expiresIn = data.expires_in;

            return data;
        } catch (error) {
            console.error('生成二维码失败:', error);
            throw error;
        }
    }

    /**
     * 轮询扫码状态
     */
    async pollScanStatus() {
        try {
            const response = await fetch(`${this.apiBase}/wechat/poll/${this.sceneStr}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '轮询状态失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('轮询状态失败:', error);
            throw error;
        }
    }

    /**
     * 开始轮询
     */
    startPolling(onStatusChange) {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }

        // 每 2 秒轮询一次
        this.pollTimer = setInterval(async () => {
            try {
                const result = await this.pollScanStatus();

                if (onStatusChange) {
                    onStatusChange(result);
                }

                // 如果状态是 confirmed, expired 或 需要绑定手机号，停止轮询
                if (result.status === 'confirmed' ||
                    result.status === 'expired' ||
                    result.need_bind_phone) {
                    this.stopPolling();
                }

                // 如果登录成功且有用户信息，保存并跳转
                if (result.status === 'confirmed' && result.user && result.access_token) {
                    window.apiClient.saveTokens(result.access_token, result.refresh_token);
                    window.apiClient.saveUserInfo(result.user);

                    // 触发登录成功
                    if (onStatusChange) {
                        onStatusChange({
                            ...result,
                            loginSuccess: true
                        });
                    }
                }

                // 如果需要绑定手机号，保存 session_token
                if (result.need_bind_phone && result.session_token) {
                    this.sessionToken = result.session_token;
                }

            } catch (error) {
                console.error('轮询出错:', error);
                this.stopPolling();
                if (onStatusChange) {
                    onStatusChange({
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }, 2000);
    }

    /**
     * 停止轮询
     */
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /**
     * 绑定手机号（新用户）
     */
    async bindPhone(phone, verificationCode) {
        try {
            const response = await fetch(`${this.apiBase}/wechat/bind-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_token: this.sessionToken,
                    phone: phone,
                    verification_code: verificationCode
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '绑定手机号失败');
            }

            const data = await response.json();

            // 保存 token 和用户信息
            window.apiClient.saveTokens(data.access_token, data.refresh_token);
            window.apiClient.saveUserInfo(data.user);

            return data;
        } catch (error) {
            console.error('绑定手机号失败:', error);
            throw error;
        }
    }

    /**
     * 关联已有账号
     */
    async linkAccount(phone, password) {
        try {
            const response = await fetch(`${this.apiBase}/wechat/link-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_token: this.sessionToken,
                    phone: phone,
                    password: password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '关联账号失败');
            }

            const data = await response.json();

            // 保存 token 和用户信息
            window.apiClient.saveTokens(data.access_token, data.refresh_token);
            window.apiClient.saveUserInfo(data.user);

            return data;
        } catch (error) {
            console.error('关联账号失败:', error);
            throw error;
        }
    }

    /**
     * 绑定微信（已登录用户）
     */
    async bindWechat(code) {
        try {
            const response = await fetch(`${this.apiBase}/wechat/bind`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.apiClient.getAccessToken()}`
                },
                body: JSON.stringify({
                    code: code
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '绑定微信失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('绑定微信失败:', error);
            throw error;
        }
    }

    /**
     * 解绑微信（已登录用户）
     */
    async unbindWechat() {
        try {
            const response = await fetch(`${this.apiBase}/wechat/unbind`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.apiClient.getAccessToken()}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || '解绑微信失败');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('解绑微信失败:', error);
            throw error;
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stopPolling();
        this.sceneStr = null;
        this.sessionToken = null;
        this.qrCodeUrl = null;
    }
}

// 创建全局实例
window.wechatLogin = new WechatLogin();
