// 全局初始化标记，避免重复初始化
let hasInitialized = false;

function initHomePage() {
    if (hasInitialized) return;

    // 初始化 AOS 动画
    try {
        if (window.AOS && typeof window.AOS.init === 'function') {
            window.AOS.init({
                once: true,
                duration: 800,
                easing: 'ease-out-cubic'
            });
        }
    } catch (e) {
        console.error('AOS 初始化失败:', e);
    }

    // 初始化 Swiper 轮播（客户案例）
    try {
        if (window.Swiper) {
            const swiperEl = document.querySelector('.cases-slider .swiper');
            if (swiperEl) {
                // eslint-disable-next-line no-new
                new window.Swiper(swiperEl, {
                    loop: true,
                    speed: 600,
                    slidesPerView: 1,
                    spaceBetween: 24,
                    autoplay: {
                        delay: 4000,
                        disableOnInteraction: false,
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                        dynamicBullets: true,
                    },
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev'
                    },
                    breakpoints: {
                        640: { 
                            slidesPerView: 1,
                            spaceBetween: 20
                        },
                        768: { 
                            slidesPerView: 2,
                            spaceBetween: 24
                        },
                        1024: { 
                            slidesPerView: 3,
                            spaceBetween: 30
                        },
                        1280: { 
                            slidesPerView: 3,
                            spaceBetween: 30
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error('Swiper 初始化失败:', e);
    }

    hasInitialized = true;

    // 初始化英雄区轮播
    try {
        initHeroCarousel();
    } catch (e) {
        console.error('英雄轮播初始化失败:', e);
    }

    // 移除旧的像素动效/背景增强
    removeLegacyHeroEffects();
}

// DOM 就绪后尝试初始化
document.addEventListener('DOMContentLoaded', initHomePage);

// 组件（header/footer）异步插入完成后再次初始化，确保导航等元素就绪
window.addEventListener('componentsLoaded', initHomePage);

// ===== Pixelated Hero Background =====
function initHeroCarousel() {
    if (!window.Swiper) return;
    const el = document.querySelector('.hero-swiper');
    if (!el) return;
    // eslint-disable-next-line no-new
    new window.Swiper(el, {
        loop: true,
        speed: 900,
        autoplay: { delay: 3500, disableOnInteraction: false },
        pagination: { el: '.hero-swiper-pagination', clickable: true },
        navigation: { nextEl: '.hero-swiper-next', prevEl: '.hero-swiper-prev' }
    });
}

function removeLegacyHeroEffects() {
    // 移除像素 canvas 和 TRAE 背景层
    document.querySelectorAll('.hero-canvas, .hero-bg-blob, .hero-bg-grid').forEach(el => el.remove());
}

