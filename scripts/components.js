// 组件加载器
class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
    }

    // 加载组件
    async loadComponent(componentName, targetElementId) {
        if (this.loadedComponents.has(componentName)) {
            return;
        }

        try {
            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${componentName}: ${response.status}`);
            }
            
            const html = await response.text();
            const targetElement = document.getElementById(targetElementId);
            
            if (targetElement) {
                targetElement.innerHTML = html;
                this.loadedComponents.add(componentName);
                
                // 如果是header组件，需要初始化导航功能
                if (componentName === 'header') {
                    this.initNavigation();
                    this.initThemeToggle();
                }
            } else {
                console.error(`Target element with id '${targetElementId}' not found`);
            }
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    }

    // 初始化导航功能
    initNavigation() {
        // 等待一小段时间确保DOM完全渲染
        setTimeout(() => {
            // 移动端菜单切换
            const navToggle = document.getElementById('nav-toggle');
            const navMenu = document.getElementById('nav-menu');
            const navbar = document.getElementById('navbar');

            if (navToggle && navMenu) {
                navToggle.addEventListener('click', () => {
                    navMenu.classList.toggle('active');
                    navToggle.classList.toggle('active');
                });

                // 点击菜单项时关闭移动端菜单
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        navMenu.classList.remove('active');
                        navToggle.classList.remove('active');
                    });
                });
            }

            // 导航栏滚动效果
            if (navbar) {
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 50) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                });
            }

            // 平滑滚动
            this.initSmoothScrolling();

            // 初始化认证状态
            this.initAuthState();
        }, 100);
    }

    // 初始化平滑滚动
    initSmoothScrolling() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // 检查是否是外部链接（包含.html）
                if (href.includes('.html')) {
                    // 让浏览器处理导航
                    return;
                }

                // 处理内部锚点链接
                e.preventDefault();
                const targetSection = document.querySelector(href);

                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 70; // 考虑固定导航栏
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 初始化认证状态
    initAuthState() {
        const loginButton = document.getElementById('login-button');
        const userMenu = document.getElementById('user-menu');
        const userName = document.getElementById('user-name');
        const logoutButton = document.getElementById('logout-button');
        const userMenuTrigger = document.getElementById('user-menu-trigger');
        const userDropdown = document.getElementById('user-dropdown');

        // 检查是否已登录（检查localStorage中的token）
        const accessToken = localStorage.getItem('access_token');
        const userInfoStr = localStorage.getItem('user_info');

        if (accessToken && userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);

                // 已登录：隐藏登录按钮，显示用户菜单
                if (loginButton) {
                    loginButton.classList.add('hidden');
                    loginButton.classList.remove('visible');
                }
                if (userMenu) {
                    userMenu.classList.remove('hidden');
                    userMenu.classList.add('visible');
                    userMenu.style.display = 'flex';
                }

                // 更新用户菜单触发器中的用户名
                if (userName && userInfo.phone) {
                    const phone = userInfo.phone;
                    const maskedPhone = phone.substring(0, 3) + '****' + phone.substring(7);
                    userName.textContent = maskedPhone;
                }

                // 更新下拉菜单中的用户信息
                this.updateDropdownUserInfo(userInfo);

                // 初始化下拉菜单交互
                if (userMenuTrigger && userDropdown) {
                    userMenuTrigger.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleDropdown(userMenuTrigger, userDropdown);
                    });

                    // 点击外部区域关闭下拉菜单
                    document.addEventListener('click', (e) => {
                        if (!userMenu.contains(e.target)) {
                            this.closeDropdown(userMenuTrigger, userDropdown);
                        }
                    });
                }
            } catch (error) {
                console.error('Failed to parse user info:', error);
                this.showLoginButton();
            }
        } else {
            // 未登录：显示登录按钮，隐藏用户菜单
            this.showLoginButton();
        }

        // 登出按钮事件
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    // 更新下拉菜单中的用户信息
    updateDropdownUserInfo(userInfo) {
        // 更新用户显示名称
        const userDisplayName = document.getElementById('user-display-name');
        if (userDisplayName && userInfo.username) {
            userDisplayName.textContent = userInfo.username;
        }

        // 更新用户电话
        const userPhoneDisplay = document.getElementById('user-phone-display');
        if (userPhoneDisplay && userInfo.phone) {
            const phone = userInfo.phone;
            const maskedPhone = phone.substring(0, 3) + '****' + phone.substring(7);
            userPhoneDisplay.textContent = maskedPhone;
        }

        // 更新用户头像
        const userAvatar = document.getElementById('user-avatar');
        const avatarPlaceholder = userAvatar ? userAvatar.querySelector('.avatar-placeholder') : null;

        if (userAvatar && userInfo.avatar) {
            // 如果有头像URL，创建img元素替换placeholder
            const existingImg = userAvatar.querySelector('img');
            if (existingImg) {
                existingImg.src = userInfo.avatar;
            } else {
                const img = document.createElement('img');
                img.src = userInfo.avatar;
                img.alt = '用户头像';
                if (avatarPlaceholder) {
                    avatarPlaceholder.style.display = 'none';
                }
                userAvatar.appendChild(img);
            }
        } else if (userAvatar && userInfo.wechat_avatar) {
            // 如果有微信头像，使用微信头像
            const existingImg = userAvatar.querySelector('img');
            if (existingImg) {
                existingImg.src = userInfo.wechat_avatar;
            } else {
                const img = document.createElement('img');
                img.src = userInfo.wechat_avatar;
                img.alt = '用户头像';
                if (avatarPlaceholder) {
                    avatarPlaceholder.style.display = 'none';
                }
                userAvatar.appendChild(img);
            }
        }
    }

    // 切换下拉菜单显示/隐藏
    toggleDropdown(trigger, dropdown) {
        const isOpen = dropdown.classList.contains('show');

        if (isOpen) {
            this.closeDropdown(trigger, dropdown);
        } else {
            this.openDropdown(trigger, dropdown);
        }
    }

    // 打开下拉菜单
    openDropdown(trigger, dropdown) {
        trigger.classList.add('active');
        dropdown.classList.add('show');
    }

    // 关闭下拉菜单
    closeDropdown(trigger, dropdown) {
        trigger.classList.remove('active');
        dropdown.classList.remove('show');
    }

    // 显示登录按钮
    showLoginButton() {
        const loginButton = document.getElementById('login-button');
        const userMenu = document.getElementById('user-menu');

        if (loginButton) {
            loginButton.classList.remove('hidden');
            loginButton.classList.add('visible');
        }
        if (userMenu) {
            userMenu.classList.add('hidden');
            userMenu.classList.remove('visible');
        }
    }

    // 处理登出
    handleLogout() {
        // 清除localStorage中的认证信息
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');

        // 跳转到认证页面
        window.location.href = 'auth.html';
    }

    // 主题切换（暗/亮），持久化到 localStorage
    initThemeToggle() {
        const rootEl = document.documentElement;
        const saved = localStorage.getItem('theme') || 'light';
        if (saved === 'dark') rootEl.classList.add('dark');

        const btn = document.getElementById('theme-toggle');
        const icon = btn ? btn.querySelector('.theme-icon') : null;

        const applyIcon = () => {
            if (!icon) return;
            icon.textContent = rootEl.classList.contains('dark') ? '☀️' : '🌙';
        };
        applyIcon();

        if (btn) {
            btn.addEventListener('click', () => {
                const isDark = rootEl.classList.toggle('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                applyIcon();
            });
        }
    }

    // 加载所有组件
    async loadAllComponents() {
        const components = [
            { name: 'header', targetId: 'header-placeholder' },
            { name: 'footer', targetId: 'footer-placeholder' }
        ];

        const loadPromises = components.map(component => 
            this.loadComponent(component.name, component.targetId)
        );

        await Promise.all(loadPromises);
        
        // 组件加载完成后，触发自定义事件
        window.dispatchEvent(new CustomEvent('componentsLoaded'));
    }
}

// 创建全局实例
window.componentLoader = new ComponentLoader();

// 页面加载完成后自动加载组件
document.addEventListener('DOMContentLoaded', () => {
    window.componentLoader.loadAllComponents();
});
