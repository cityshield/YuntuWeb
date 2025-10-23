// 清除浏览器缓存的脚本
// 在浏览器控制台中运行此脚本来清除缓存

// 清除所有缓存
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
        }
    });
}

// 清除localStorage
localStorage.clear();

// 清除sessionStorage
sessionStorage.clear();

// 重新加载页面
location.reload(true);

console.log('缓存已清除，页面正在重新加载...');

