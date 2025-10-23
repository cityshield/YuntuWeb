# 缓存问题解决方案

## 问题描述
在开发过程中，您可能会遇到需要强制刷新（Ctrl+F5）才能看到最新样式的问题。这是由于浏览器缓存导致的。

## 已实施的解决方案

### 1. Vite配置优化
- 在 `vite.config.js` 中添加了无缓存头部
- 开发服务器现在会发送 `Cache-Control: no-cache` 头部

### 2. HTML Meta标签
- 在HTML文件中添加了缓存控制meta标签
- 防止浏览器缓存HTML和CSS文件

### 3. CSS版本控制
- 为CSS文件添加了版本参数 `?v=1.0.0`
- 当样式更新时，可以修改版本号强制刷新

### 4. 开发脚本
- 创建了 `start-dev.sh` 脚本，启动时自动清除缓存
- 创建了 `clear-cache.js` 脚本，可在浏览器控制台运行

## 使用方法

### 方法1：使用开发脚本（推荐）
```bash
./start-dev.sh
```

### 方法2：手动清除缓存
1. 按 `Ctrl+Shift+Delete` 打开清除数据对话框
2. 选择"缓存的图片和文件"
3. 点击"清除数据"

### 方法3：强制刷新
- Windows/Linux: `Ctrl + F5`
- Mac: `Cmd + Shift + R`

### 方法4：浏览器控制台
在浏览器控制台中运行：
```javascript
// 清除缓存并重新加载
if ('caches' in window) {
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
        }
    });
}
location.reload(true);
```

## 更新CSS版本
当您修改了CSS文件后，可以更新版本号：
1. 修改 `index.html` 和 `auth.html` 中的CSS链接
2. 将 `?v=1.0.0` 改为 `?v=1.0.1`（或更高版本）

## 生产环境部署
在生产环境中，建议：
1. 移除开发环境的无缓存头部
2. 使用构建工具自动生成版本号
3. 启用适当的缓存策略以提高性能

## 故障排除
如果问题仍然存在：
1. 检查浏览器开发者工具的Network标签
2. 确认CSS文件返回200状态码
3. 检查是否有JavaScript错误阻止样式加载
4. 尝试在无痕模式下访问网站



