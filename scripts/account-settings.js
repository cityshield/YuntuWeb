/**
 * 账户设置页面 - 微信绑定/解绑功能
 */

let bindQRCode = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initAccountSettings();
});

/**
 * 初始化账户设置页面
 */
async function initAccountSettings() {
    // 检查登录状态
    if (!window.apiClient.isLoggedIn()) {
        window.location.href = 'auth.html';
        return;
    }

    // 加载用户信息
    await loadUserInfo();

    // 初始化事件监听
    initEventListeners();

    // 初始化AOS动画
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true
        });
    }
}

/**
 * 加载用户信息
 */
async function loadUserInfo() {
    try {
        // 从localStorage获取用户信息
        const userInfo = window.apiClient.getUserInfo();

        if (userInfo) {
            // 更新手机号显示
            if (userInfo.phone) {
                const maskedPhone = userInfo.phone.substring(0, 3) + '****' + userInfo.phone.substring(7);
                document.getElementById('phoneNumber').textContent = maskedPhone;
            }

            // 检查微信绑定状态
            if (userInfo.wechat_openid) {
                showBoundStatus(userInfo);
            } else {
                showUnboundStatus();
            }
        } else {
            // 如果本地没有用户信息，从API获取
            const response = await window.apiClient.get(window.API_ENDPOINTS.user.profile);
            window.apiClient.saveUserInfo(response);

            // 递归调用，使用新获取的信息
            await loadUserInfo();
        }
    } catch (error) {
        console.error('加载用户信息失败:', error);
        showError('无法加载用户信息，请刷新页面重试');
    }
}

/**
 * 显示未绑定状态
 */
function showUnboundStatus() {
    document.getElementById('unbindStatus').style.display = 'flex';
    document.getElementById('boundStatus').style.display = 'none';
}

/**
 * 显示已绑定状态
 */
function showBoundStatus(userInfo) {
    document.getElementById('unbindStatus').style.display = 'none';
    document.getElementById('boundStatus').style.display = 'flex';

    // 更新微信信息
    if (userInfo.wechat_nickname) {
        document.getElementById('wechatNickname').textContent = userInfo.wechat_nickname;
    }

    if (userInfo.wechat_avatar) {
        const avatarImg = document.getElementById('avatarImg');
        avatarImg.src = userInfo.wechat_avatar;
        avatarImg.style.display = 'block';
    }

    if (userInfo.wechat_bound_at) {
        const boundTime = new Date(userInfo.wechat_bound_at).toLocaleString('zh-CN');
        document.getElementById('boundTime').textContent = boundTime;
    }
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
    // 绑定微信按钮
    const bindBtn = document.getElementById('bindWechatBtn');
    if (bindBtn) {
        bindBtn.addEventListener('click', handleBindWechat);
    }

    // 解绑微信按钮
    const unbindBtn = document.getElementById('unbindWechatBtn');
    if (unbindBtn) {
        unbindBtn.addEventListener('click', showUnbindConfirm);
    }

    // 关闭绑定弹窗
    const closeBindModal = document.getElementById('closeBindModal');
    if (closeBindModal) {
        closeBindModal.addEventListener('click', closeBindModal);
    }

    // 关闭解绑确认弹窗
    const closeUnbindModal = document.getElementById('closeUnbindModal');
    if (closeUnbindModal) {
        closeUnbindModal.addEventListener('click', closeUnbindConfirmModal);
    }

    // 取消解绑
    const cancelUnbind = document.getElementById('cancelUnbind');
    if (cancelUnbind) {
        cancelUnbind.addEventListener('click', closeUnbindConfirmModal);
    }

    // 确认解绑
    const confirmUnbind = document.getElementById('confirmUnbind');
    if (confirmUnbind) {
        confirmUnbind.addEventListener('click', handleUnbindWechat);
    }

    // 点击遮罩层关闭弹窗
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const modal = this.closest('.wechat-bind-modal, .confirm-modal');
            if (modal) {
                modal.style.display = 'none';
                // 清理二维码
                if (bindQRCode) {
                    bindQRCode = null;
                }
            }
        });
    });
}

/**
 * 处理绑定微信
 */
async function handleBindWechat() {
    const modal = document.getElementById('wechatBindModal');
    const statusEl = document.getElementById('bindStatus');
    const qrContainer = document.getElementById('bindQRCode');

    // 显示弹窗
    modal.style.display = 'flex';
    statusEl.textContent = '正在生成二维码...';
    statusEl.style.color = 'var(--primary-color)';
    qrContainer.innerHTML = '';

    try {
        // 生成二维码（注意：这里需要特殊处理，因为是已登录用户绑定）
        // 我们直接调用微信授权URL，不使用场景值轮询
        // 实际实现中可能需要后端提供专门的"已登录用户绑定"接口

        // 暂时显示提示信息
        statusEl.textContent = '请扫描二维码并授权';
        statusEl.style.color = 'var(--text-secondary)';

        // 这里应该调用后端API生成专门用于绑定的二维码
        // 由于当前后端API设计主要针对登录场景，这里作为示例展示
        showInfo('绑定功能开发中：需要在微信开放平台配置回调地址，并获取用户授权code后调用绑定API');

    } catch (error) {
        console.error('生成二维码失败:', error);
        statusEl.textContent = '生成二维码失败';
        statusEl.style.color = '#dc2626';
        showError(error.message || '生成二维码失败');
    }
}

/**
 * 关闭绑定弹窗
 */
function closeBindModal() {
    const modal = document.getElementById('wechatBindModal');
    modal.style.display = 'none';

    // 清理二维码
    if (bindQRCode) {
        bindQRCode = null;
    }

    document.getElementById('bindQRCode').innerHTML = '';
}

/**
 * 显示解绑确认弹窗
 */
function showUnbindConfirm() {
    const modal = document.getElementById('confirmUnbindModal');
    modal.style.display = 'flex';
}

/**
 * 关闭解绑确认弹窗
 */
function closeUnbindConfirmModal() {
    const modal = document.getElementById('confirmUnbindModal');
    modal.style.display = 'none';
}

/**
 * 处理解绑微信
 */
async function handleUnbindWechat() {
    const confirmBtn = document.getElementById('confirmUnbind');
    const btnText = confirmBtn.querySelector('.btn-text');
    const btnLoading = confirmBtn.querySelector('.btn-loading');

    // 显示加载状态
    confirmBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        // 调用解绑API
        const result = await window.wechatLogin.unbindWechat();

        // 解绑成功
        if (result.success) {
            // 更新本地用户信息
            const userInfo = window.apiClient.getUserInfo();
            if (userInfo) {
                delete userInfo.wechat_openid;
                delete userInfo.wechat_unionid;
                delete userInfo.wechat_nickname;
                delete userInfo.wechat_avatar;
                delete userInfo.wechat_bound_at;
                window.apiClient.saveUserInfo(userInfo);
            }

            // 关闭弹窗
            closeUnbindConfirmModal();

            // 显示成功消息
            showSuccess('解绑成功！');

            // 更新UI
            showUnboundStatus();
        }

    } catch (error) {
        console.error('解绑失败:', error);
        showError(error.message || '解绑失败，请重试');

    } finally {
        // 恢复按钮状态
        confirmBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

/**
 * 显示成功消息
 */
function showSuccess(message) {
    // 简单的提示实现，可以后续替换为更好的toast组件
    alert(message);
}

/**
 * 显示错误消息
 */
function showError(message) {
    alert('错误: ' + message);
}

/**
 * 显示信息消息
 */
function showInfo(message) {
    alert('提示: ' + message);
}
