#!/bin/bash

# 盛世云图网站开发环境启动脚本

echo "🚀 启动盛世云图网站开发环境..."

# 清除可能的缓存文件
echo "🧹 清除缓存文件..."
rm -rf node_modules/.vite
rm -rf dist

# 启动开发服务器
echo "📦 启动Vite开发服务器..."
npm run dev

echo "✅ 开发环境已启动！"
echo "🌐 访问地址: http://localhost:3000"
echo "💡 如果样式有问题，请按 Ctrl+F5 强制刷新页面"

