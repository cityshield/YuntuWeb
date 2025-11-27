/**
 * 主题切换功能
 * 支持亮色/暗色主题切换,并保存用户偏好
 */

(function() {
    'use strict';

    const THEME_KEY = 'theme';
    const THEME_CLASS = 'dark';

    /**
     * 获取当前主题
     */
    function getCurrentTheme() {
        // 优先从 localStorage 读取
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme) {
            return savedTheme;
        }

        // 否则检查系统偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * 应用主题
     */
    function applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add(THEME_CLASS);
        } else {
            root.classList.remove(THEME_CLASS);
        }

        // 保存到 localStorage
        localStorage.setItem(THEME_KEY, theme);

        // 触发主题变更事件
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    /**
     * 切换主题
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        return newTheme;
    }

    /**
     * 初始化主题切换按钮
     */
    function initThemeToggle() {
        // 应用初始主题
        const initialTheme = getCurrentTheme();
        applyTheme(initialTheme);

        // 查找所有主题切换按钮(支持多个页面有多个按钮)
        const toggleButtons = document.querySelectorAll('[id^="theme-toggle"], [id*="theme-toggle"]');

        console.log('[ThemeToggle] 找到', toggleButtons.length, '个主题切换按钮');

        toggleButtons.forEach(button => {
            if (button) {
                console.log('[ThemeToggle] 初始化按钮:', button.id);
                button.addEventListener('click', () => {
                    console.log('[ThemeToggle] 按钮被点击:', button.id);
                    toggleTheme();
                });
            }
        });

        // 监听系统主题变化
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // 只有在用户没有手动设置过主题时才跟随系统
                if (!localStorage.getItem(THEME_KEY)) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    applyTheme(newTheme);
                }
            });
        }
    }

    // 尽早应用主题,避免闪烁
    const theme = getCurrentTheme();
    if (theme === 'dark') {
        document.documentElement.classList.add(THEME_CLASS);
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }

    // 组件加载完成后再次初始化(针对异步加载的 header)
    window.addEventListener('componentsLoaded', initThemeToggle);

    // 导出 API
    window.themeToggle = {
        getCurrentTheme,
        applyTheme,
        toggleTheme
    };
})();
