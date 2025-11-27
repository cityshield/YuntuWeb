// Authentication JavaScript for YuntuCV Website

// Global variables
let captchaCodes = {
    login: '',
    register: ''
};

let smsCountdown = 0;
let smsTimer = null;

// Initialize authentication page
document.addEventListener('DOMContentLoaded', function() {
    initAuthPage();
});

function initAuthPage() {
    // 检查用户是否已登录
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        // 已登录，跳转到首页
        window.location.href = 'index.html';
        return;
    }

    // Initialize tabs
    initTabs();

    // Initialize captcha
    initCaptcha();

    // Initialize form validation
    initFormValidation();

    // Initialize password strength
    initPasswordStrength();

    // Initialize form submission
    initFormSubmission();
}

// Tab switching functionality
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and forms
            tabBtns.forEach(b => b.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            btn.classList.add('active');
            const targetForm = document.getElementById(`${targetTab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
            
            // Refresh captcha for the active form
            refreshCaptcha(targetTab);
        });
    });
}

// Captcha functionality
function initCaptcha() {
    refreshCaptcha('login');
    refreshCaptcha('register');
}

function generateCaptchaCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function drawCaptcha(canvasId, code) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`Canvas element with id '${canvasId}' not found`);
        return;
    }

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise lines
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
    
    // Add noise dots
    for (let i = 0; i < 20; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Draw text
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < code.length; i++) {
        const x = (canvas.width / code.length) * (i + 0.5);
        const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
        const angle = (Math.random() - 0.5) * 0.5;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
        ctx.fillText(code[i], 0, 0);
        ctx.restore();
    }
}

function refreshCaptcha(type) {
    const code = generateCaptchaCode();
    captchaCodes[type] = code;

    const canvasId = `${type}CaptchaCanvas`;
    drawCaptcha(canvasId, code);

    // Clear input
    const inputElement = document.getElementById(`${type}Captcha`);
    if (inputElement) {
        inputElement.value = '';
    }

    console.log(`Captcha for ${type}: ${code}`); // For development - remove in production
}

// SMS verification functionality
async function sendSmsCode() {
    const phoneInput = document.getElementById('registerPhone');
    const phone = phoneInput.value.trim();
    const phoneError = document.getElementById('registerPhoneError');
    const smsBtn = document.getElementById('smsBtn');
    const smsText = smsBtn.querySelector('.sms-text');
    const smsCountdownEl = smsBtn.querySelector('.sms-countdown');

    // Validate phone number
    if (!validatePhone(phone)) {
        showError('registerPhoneError', '请输入正确的手机号');
        phoneInput.classList.add('error');
        return;
    }

    // Disable button
    smsBtn.disabled = true;

    try {
        // 调用后端API发送短信验证码
        const response = await apiClient.sendVerificationCode(phone);

        if (response.success) {
            showSuccessMessage(response.message || '验证码已发送，请注意查收短信');

            // Start countdown
            smsText.style.display = 'none';
            smsCountdownEl.style.display = 'inline';

            smsCountdown = 60;
            smsTimer = setInterval(() => {
                smsCountdown--;
                smsCountdownEl.textContent = `${smsCountdown}s`;

                if (smsCountdown <= 0) {
                    clearInterval(smsTimer);
                    smsBtn.disabled = false;
                    smsText.style.display = 'inline';
                    smsCountdownEl.style.display = 'none';
                }
            }, 1000);
        } else {
            throw new Error(response.message || '发送验证码失败');
        }
    } catch (error) {
        console.error('发送验证码失败:', error);
        showError('registerPhoneError', error.message || '发送验证码失败，请重试');
        smsBtn.disabled = false;
    }
}

// Form validation
function initFormValidation() {
    // Phone number validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('blur', () => validatePhoneInput(input));
        input.addEventListener('input', () => clearError(input));
    });
    
    // Password validation
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('blur', () => validatePasswordInput(input));
        input.addEventListener('input', () => clearError(input));
    });
    
    // Captcha validation
    const captchaInputs = document.querySelectorAll('input[name="captcha"]');
    captchaInputs.forEach(input => {
        input.addEventListener('blur', () => validateCaptchaInput(input));
        input.addEventListener('input', () => clearError(input));
    });
    
    // SMS code validation
    const smsInput = document.getElementById('smsCode');
    if (smsInput) {
        smsInput.addEventListener('blur', () => validateSmsInput(smsInput));
        smsInput.addEventListener('input', () => clearError(smsInput));
    }
}

function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

function validatePhoneInput(input) {
    const phone = input.value.trim();
    const errorId = input.id + 'Error';
    
    if (!phone) {
        showError(errorId, '请输入手机号');
        input.classList.add('error');
        return false;
    }
    
    if (!validatePhone(phone)) {
        showError(errorId, '请输入正确的手机号');
        input.classList.add('error');
        return false;
    }
    
    clearError(input);
    return true;
}

function validatePasswordInput(input) {
    const password = input.value;
    const errorId = input.id + 'Error';
    
    if (!password) {
        showError(errorId, '请输入密码');
        input.classList.add('error');
        return false;
    }
    
    if (password.length < 6) {
        showError(errorId, '密码长度至少6位');
        input.classList.add('error');
        return false;
    }
    
    if (input.id === 'registerPassword' && !isStrongPassword(password)) {
        showError(errorId, '密码强度不够，请包含字母和数字');
        input.classList.add('error');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateCaptchaInput(input) {
    const captcha = input.value.trim().toLowerCase();
    const formType = input.id.replace('Captcha', '');
    const correctCaptcha = captchaCodes[formType].toLowerCase();
    const errorId = input.id + 'Error';
    
    if (!captcha) {
        showError(errorId, '请输入验证码');
        input.classList.add('error');
        return false;
    }
    
    if (captcha !== correctCaptcha) {
        showError(errorId, '验证码错误');
        input.classList.add('error');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateSmsInput(input) {
    const smsCode = input.value.trim();
    const errorId = input.id + 'Error';

    if (!smsCode) {
        showError(errorId, '请输入短信验证码');
        input.classList.add('error');
        return false;
    }

    if (!/^\d{6}$/.test(smsCode)) {
        showError(errorId, '请输入6位数字验证码');
        input.classList.add('error');
        return false;
    }

    // 验证码的正确性由后端验证，前端只验证格式
    clearError(input);
    return true;
}

function isStrongPassword(password) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasLetter && hasNumber && password.length >= 6;
}

// Password strength indicator
function initPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    if (!passwordInput) return;
    
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = getPasswordStrength(password);
        
        strengthBar.className = 'strength-fill';
        if (password.length > 0) {
            strengthBar.classList.add(strength.level);
            strengthText.textContent = strength.text;
        } else {
            strengthText.textContent = '密码强度';
        }
    });
}

function getPasswordStrength(password) {
    if (password.length < 6) {
        return { level: 'weak', text: '密码太短' };
    }
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    if (hasLetter) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    if (password.length >= 8) score++;
    
    if (score <= 1) {
        return { level: 'weak', text: '密码强度：弱' };
    } else if (score <= 2) {
        return { level: 'medium', text: '密码强度：中等' };
    } else {
        return { level: 'strong', text: '密码强度：强' };
    }
}

// Form submission
function initFormSubmission() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const phone = formData.get('phone').trim();
    const password = formData.get('password');
    const captcha = formData.get('captcha').trim().toLowerCase();

    // Validate all fields
    const isPhoneValid = validatePhoneInput(document.getElementById('loginPhone'));
    const isPasswordValid = validatePasswordInput(document.getElementById('loginPassword'));
    const isCaptchaValid = validateCaptchaInput(document.getElementById('loginCaptcha'));

    if (!isPhoneValid || !isPasswordValid || !isCaptchaValid) {
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);

    try {
        // 调用后端登录API
        const response = await apiClient.login({
            username: phone,  // 使用手机号作为用户名
            password: password
        });

        hideLoading(submitBtn);

        // 登录成功
        showSuccessMessage('登录成功！正在跳转...');

        console.log('登录成功，用户信息:', response.user);

        // 跳转到控制台
        setTimeout(() => {
            window.location.href = 'console.html';
        }, 1500);

    } catch (error) {
        hideLoading(submitBtn);
        console.error('登录失败:', error);

        // 判断错误类型
        const isServerError = error.isServerError || error.message.includes('Failed to fetch') || error.message.includes('Network');
        const isAuthError = error.status === 401 || error.status === 403 || error.message.includes('Incorrect');

        if (isServerError) {
            // 服务端错误或网络错误，使用toast提示
            showToast('服务不可用，请联系官方', 'error');
        } else {
            // 业务逻辑错误，显示在表单下方
            let errorMessage = '登录失败，请检查手机号和密码';

            if (isAuthError) {
                errorMessage = '手机号或密码错误';
            } else if (error.message) {
                // 显示服务端返回的具体错误信息（已是中文）
                errorMessage = error.message;
            }

            showError('loginPasswordError', errorMessage);
        }

        // 刷新验证码
        refreshCaptcha('login');
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const phone = formData.get('phone').trim();
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const smsCode = formData.get('smsCode').trim();

    // Validate all fields
    const isPhoneValid = validatePhoneInput(document.getElementById('registerPhone'));
    const isPasswordValid = validatePasswordInput(document.getElementById('registerPassword'));
    const isConfirmPasswordValid = validateConfirmPassword();
    const isSmsValid = validateSmsInput(document.getElementById('smsCode'));

    if (!isPhoneValid || !isPasswordValid || !isConfirmPasswordValid || !isSmsValid) {
        return;
    }

    // 检查是否同意用户协议
    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms.checked) {
        showError('registerPhoneError', '请阅读并同意用户协议和隐私政策');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);

    try {
        // 调用后端注册API
        const response = await apiClient.register({
            username: phone,  // 使用手机号作为用户名
            phone: phone,
            verification_code: smsCode,
            password: password
        });

        hideLoading(submitBtn);

        // 注册成功
        showSuccessMessage('注册成功！正在跳转...');

        console.log('注册成功，用户信息:', response.user);

        // 跳转到控制台（因为已经自动登录）
        setTimeout(() => {
            window.location.href = 'console.html';
        }, 1500);

    } catch (error) {
        hideLoading(submitBtn);
        console.error('注册失败:', error);

        // 判断错误类型
        const isServerError = error.isServerError || error.message.includes('Failed to fetch') || error.message.includes('Network');

        if (isServerError) {
            // 服务端错误或网络错误，使用toast提示
            showToast('服务不可用，请联系官方', 'error');
        } else {
            // 业务逻辑错误，显示在表单下方
            let errorMessage = '注册失败，请重试';
            let errorFieldId = 'registerPhoneError';

            if (error.message) {
                errorMessage = error.message;

                // 根据错误信息判断显示位置
                if (error.message.includes('验证码') || error.message.includes('验证')) {
                    errorFieldId = 'smsCodeError';
                } else if (error.message.includes('手机号')) {
                    errorFieldId = 'registerPhoneError';
                } else if (error.message.includes('用户名')) {
                    errorMessage = '该手机号已被注册';
                    errorFieldId = 'registerPhoneError';
                } else if (error.message.includes('密码')) {
                    errorFieldId = 'registerPasswordError';
                }
            }

            showError(errorFieldId, errorMessage);
        }
    }
}

function validateConfirmPassword() {
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorId = 'confirmPasswordError';
    
    if (!confirmPassword) {
        showError(errorId, '请确认密码');
        document.getElementById('confirmPassword').classList.add('error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showError(errorId, '两次输入的密码不一致');
        document.getElementById('confirmPassword').classList.add('error');
        return false;
    }
    
    clearError(document.getElementById('confirmPassword'));
    return true;
}

// Utility functions
function showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function clearError(input) {
    const errorId = input.id + 'Error';
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    }
    input.classList.remove('error');
}

function showLoading(button) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
}

function hideLoading(button) {
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
}

function showSuccessMessage(message) {
    // Remove existing success message
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create new success message
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;

    // Insert at the top of the active form
    const activeForm = document.querySelector('.auth-form.active');
    activeForm.insertBefore(successEl, activeForm.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (successEl.parentNode) {
            successEl.remove();
        }
    }, 5000);
}

function showToast(message, type = 'error') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';

    // Set styles based on type
    const colors = {
        error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
        warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
        success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
        info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
    };

    const color = colors[type] || colors.error;

    toast.style.cssText = `
        background: ${color.bg};
        border-left: 4px solid ${color.border};
        color: ${color.text};
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        min-width: 300px;
        pointer-events: auto;
        animation: slideInDown 0.3s ease-out;
    `;

    toast.textContent = message;

    // Add CSS animation if not exists
    if (!document.getElementById('toast-animation-style')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-style';
        style.textContent = `
            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes slideOutUp {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add toast to container
    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            // Remove container if empty
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, 3000);
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.parentNode.querySelector('.password-toggle');
    const eyeIcon = toggle.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        input.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Initialize AOS animations
if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });
}

// ===== 微信登录功能 =====

let wechatQRCode = null;
let wechatSmsCountdown = 0;
let wechatSmsTimer = null;

/**
 * 显示微信登录弹窗
 */
async function showWechatLogin() {
    const modal = document.getElementById('wechatModal');
    if (!modal) return;

    // 显示弹窗
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // 显示二维码容器，隐藏其他容器
    showWechatQRContainer();

    // 生成二维码
    try {
        const qrData = await window.wechatLogin.generateQRCode();

        // 清除旧的二维码
        const qrContainer = document.getElementById('wechatQRCode');
        qrContainer.innerHTML = '';

        // 生成二维码
        wechatQRCode = new QRCode(qrContainer, {
            text: qrData.qr_code_url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // 更新状态
        updateWechatStatus('等待扫码中...');

        // 开始轮询
        window.wechatLogin.startPolling(handleWechatStatusChange);

    } catch (error) {
        console.error('生成二维码失败:', error);
        updateWechatStatus('生成二维码失败，请重试', 'error');
    }
}

/**
 * 关闭微信登录弹窗
 */
function closeWechatLogin() {
    const modal = document.getElementById('wechatModal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // 停止轮询
    window.wechatLogin.stopPolling();

    // 清理资源
    window.wechatLogin.cleanup();
    wechatQRCode = null;

    // 重置表单
    resetWechatForms();
}

/**
 * 处理微信扫码状态变化
 */
function handleWechatStatusChange(result) {
    console.log('微信状态更新:', result);

    switch (result.status) {
        case 'pending':
            updateWechatStatus('等待扫码中...');
            break;

        case 'scanned':
            updateWechatStatus('已扫码，请在手机上确认登录');
            break;

        case 'confirmed':
            if (result.loginSuccess) {
                // 登录成功
                updateWechatStatus('登录成功！', 'success');
                setTimeout(() => {
                    closeWechatLogin();
                    window.location.href = 'index.html';
                }, 1500);
            }
            break;

        case 'expired':
            updateWechatStatus('二维码已过期，请刷新重试', 'error');
            break;

        case 'error':
            updateWechatStatus(result.error || '登录失败', 'error');
            break;
    }

    // 如果需要绑定手机号
    if (result.need_bind_phone) {
        showWechatBindPhoneContainer();
    }
}

/**
 * 更新微信状态文本
 */
function updateWechatStatus(text, type = 'normal') {
    const statusText = document.getElementById('wechatStatusText');
    if (!statusText) return;

    statusText.textContent = text;

    // 设置颜色
    if (type === 'success') {
        statusText.style.color = '#10b981';
    } else if (type === 'error') {
        statusText.style.color = '#ef4444';
    } else {
        statusText.style.color = '#64748b';
    }
}

/**
 * 显示二维码容器
 */
function showWechatQRContainer() {
    document.getElementById('wechatQRContainer').style.display = 'block';
    document.getElementById('wechatBindPhoneContainer').style.display = 'none';
    document.getElementById('wechatLinkAccountContainer').style.display = 'none';
    document.getElementById('wechatModalTitle').textContent = '微信扫码登录';
}

/**
 * 显示绑定手机号容器
 */
function showWechatBindPhoneContainer() {
    document.getElementById('wechatQRContainer').style.display = 'none';
    document.getElementById('wechatBindPhoneContainer').style.display = 'block';
    document.getElementById('wechatLinkAccountContainer').style.display = 'none';
    document.getElementById('wechatModalTitle').textContent = '绑定手机号';
}

/**
 * 显示关联账号容器
 */
function showWechatLinkAccountContainer() {
    document.getElementById('wechatQRContainer').style.display = 'none';
    document.getElementById('wechatBindPhoneContainer').style.display = 'none';
    document.getElementById('wechatLinkAccountContainer').style.display = 'block';
    document.getElementById('wechatModalTitle').textContent = '关联已有账号';
}

/**
 * 重置微信表单
 */
function resetWechatForms() {
    const bindPhoneForm = document.getElementById('wechatBindPhoneForm');
    const linkAccountForm = document.getElementById('wechatLinkAccountForm');

    if (bindPhoneForm) bindPhoneForm.reset();
    if (linkAccountForm) linkAccountForm.reset();

    // 清除错误信息
    document.querySelectorAll('.wechat-modal .error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

/**
 * 初始化微信登录相关事件
 */
function initWechatLoginEvents() {
    // 切换到关联账号表单
    const showLinkAccountBtn = document.getElementById('showLinkAccountForm');
    if (showLinkAccountBtn) {
        showLinkAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showWechatLinkAccountContainer();
        });
    }

    // 切换到绑定手机号表单
    const showBindPhoneBtn = document.getElementById('showBindPhoneForm');
    if (showBindPhoneBtn) {
        showBindPhoneBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showWechatBindPhoneContainer();
        });
    }

    // 绑定手机号表单提交
    const bindPhoneForm = document.getElementById('wechatBindPhoneForm');
    if (bindPhoneForm) {
        bindPhoneForm.addEventListener('submit', handleWechatBindPhone);
    }

    // 关联账号表单提交
    const linkAccountForm = document.getElementById('wechatLinkAccountForm');
    if (linkAccountForm) {
        linkAccountForm.addEventListener('submit', handleWechatLinkAccount);
    }

    // 发送短信验证码（绑定手机号）
    const bindSmsBtn = document.getElementById('bindSmsBtn');
    if (bindSmsBtn) {
        bindSmsBtn.addEventListener('click', sendWechatBindSmsCode);
    }
}

/**
 * 发送绑定手机号的短信验证码
 */
async function sendWechatBindSmsCode() {
    const phoneInput = document.getElementById('bindPhone');
    const phone = phoneInput.value.trim();
    const smsBtn = document.getElementById('bindSmsBtn');
    const smsText = smsBtn.querySelector('.sms-text');
    const smsCountdownEl = smsBtn.querySelector('.sms-countdown');

    // 验证手机号
    if (!validatePhone(phone)) {
        showError('bindPhoneError', '请输入正确的手机号');
        return;
    }

    // 禁用按钮
    smsBtn.disabled = true;

    try {
        const response = await apiClient.sendVerificationCode(phone);

        if (response.success) {
            // 开始倒计时
            smsText.style.display = 'none';
            smsCountdownEl.style.display = 'inline';

            wechatSmsCountdown = 60;
            wechatSmsTimer = setInterval(() => {
                wechatSmsCountdown--;
                smsCountdownEl.textContent = `${wechatSmsCountdown}s`;

                if (wechatSmsCountdown <= 0) {
                    clearInterval(wechatSmsTimer);
                    smsBtn.disabled = false;
                    smsText.style.display = 'inline';
                    smsCountdownEl.style.display = 'none';
                }
            }, 1000);
        }
    } catch (error) {
        console.error('发送验证码失败:', error);
        showError('bindPhoneError', error.message || '发送验证码失败');
        smsBtn.disabled = false;
    }
}

/**
 * 处理绑定手机号提交
 */
async function handleWechatBindPhone(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const phone = formData.get('phone').trim();
    const smsCode = formData.get('smsCode').trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);

    try {
        const result = await window.wechatLogin.bindPhone(phone, smsCode);

        hideLoading(submitBtn);

        // 绑定成功，跳转
        setTimeout(() => {
            closeWechatLogin();
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        hideLoading(submitBtn);
        console.error('绑定失败:', error);
        showError('bindSmsCodeError', error.message || '绑定失败');
    }
}

/**
 * 处理关联账号提交
 */
async function handleWechatLinkAccount(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const phone = formData.get('phone').trim();
    const password = formData.get('password');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoading(submitBtn);

    try {
        const result = await window.wechatLogin.linkAccount(phone, password);

        hideLoading(submitBtn);

        // 关联成功，跳转
        setTimeout(() => {
            closeWechatLogin();
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        hideLoading(submitBtn);
        console.error('关联失败:', error);
        showError('linkPasswordError', error.message || '关联失败');
    }
}

// 点击弹窗外部关闭
document.addEventListener('click', function(event) {
    const modal = document.getElementById('wechatModal');
    if (event.target === modal) {
        closeWechatLogin();
    }
});

// ESC键关闭弹窗
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeWechatLogin();
    }
});

// 初始化微信登录事件（在 initAuthPage 中调用）
document.addEventListener('DOMContentLoaded', function() {
    initWechatLoginEvents();
});
