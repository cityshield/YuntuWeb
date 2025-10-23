#!/bin/bash

# 盛世云图网站启动脚本

echo "🚀 启动盛世云图官方网站..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 检查是否安装成功
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "📍 网站将在 http://localhost:3000 打开"
echo "🛑 按 Ctrl+C 停止服务器"

npm run dev



