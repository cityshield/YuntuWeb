/**
 * Environment Switcher
 * 环境切换器 - 用于在不同API环境之间切换
 */

(function() {
    'use strict';

    // 初始化环境切换器
    function initEnvSwitcher() {
        console.log('[ENV Switcher] Initializing...');

        const envLabel = document.getElementById('env-label');
        const envOptions = document.querySelectorAll('.env-option');
        const envSwitcher = document.getElementById('env-switcher');

        if (!envLabel || envOptions.length === 0) {
            console.warn('[ENV Switcher] Elements not found, skipping initialization');
            return;
        }

        // 确保容器存在且可见
        if (envSwitcher) {
            console.log('[ENV Switcher] Container found, applying styles...');
        }

        // 获取当前环境
        const currentEnv = window.CURRENT_ENV || 'production';
        console.log('[ENV Switcher] Current environment:', currentEnv);

        // 更新标签
        updateEnvLabel(currentEnv);

        // 标记当前环境选项为激活状态
        envOptions.forEach(option => {
            const env = option.getAttribute('data-env');
            if (env === currentEnv) {
                option.classList.add('active');
                console.log('[ENV Switcher] Marked as active:', env);
            } else {
                option.classList.remove('active');
            }
        });

        // 添加点击事件监听器
        envOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const newEnv = this.getAttribute('data-env');
                console.log('[ENV Switcher] Click detected, switching to:', newEnv);

                if (newEnv && newEnv !== currentEnv) {
                    switchEnvironment(newEnv);
                } else {
                    console.log('[ENV Switcher] Already in', newEnv, 'environment');
                }
            });
        });

        console.log('[ENV Switcher] Initialization complete');
    }

    // 更新环境标签
    function updateEnvLabel(env) {
        const envLabel = document.getElementById('env-label');
        if (envLabel) {
            const labels = {
                'production': '生产',
                'testing': '测试',
                'development': '开发'
            };
            const labelText = labels[env] || env;
            envLabel.textContent = labelText;
            console.log('[ENV Switcher] Label updated to:', labelText);
        }
    }

    // 切换环境
    function switchEnvironment(env) {
        console.log('[ENV Switcher] Switching environment to:', env);

        // 等待 EnvManager 加载
        const maxAttempts = 10;
        let attempts = 0;

        const trySwitch = () => {
            if (window.EnvManager && typeof window.EnvManager.setEnvironment === 'function') {
                console.log('[ENV Switcher] EnvManager found, switching...');
                window.EnvManager.setEnvironment(env);
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    console.log('[ENV Switcher] Waiting for EnvManager... attempt', attempts);
                    setTimeout(trySwitch, 100); // 重试
                } else {
                    console.error('[ENV Switcher] EnvManager not available after', maxAttempts, 'attempts');
                    console.log('[ENV Switcher] Available globals:', Object.keys(window).filter(k => k.includes('Env')));
                    alert('环境切换功能暂时不可用，请刷新页面后重试');
                }
            }
        };

        trySwitch();
    }

    // 延迟初始化，确保所有脚本都已加载
    let initAttempts = 0;
    const MAX_INIT_ATTEMPTS = 30; // 最多等待3秒

    function delayedInit() {
        initAttempts++;

        // 检查依赖是否已加载
        if (window.EnvManager && window.CURRENT_ENV) {
            console.log('[ENV Switcher] Dependencies loaded, initializing...');
            initEnvSwitcher();
        } else if (initAttempts >= MAX_INIT_ATTEMPTS) {
            console.error('[ENV Switcher] Failed to load dependencies after', initAttempts, 'attempts');
            console.log('[ENV Switcher] Available globals:', {
                EnvManager: !!window.EnvManager,
                CURRENT_ENV: window.CURRENT_ENV,
                API_CONFIG: !!window.API_CONFIG
            });
        } else {
            console.log('[ENV Switcher] Waiting for dependencies... attempt', initAttempts);
            setTimeout(delayedInit, 100);
        }
    }

    // 当DOM完全加载后延迟初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(delayedInit, 300); // 给其他脚本加载时间
        });
    } else {
        // DOM已经加载完成
        setTimeout(delayedInit, 300);
    }

    // 导出到全局(用于调试)
    window.EnvSwitcher = {
        init: initEnvSwitcher,
        updateLabel: updateEnvLabel,
        switch: switchEnvironment
    };
})();
