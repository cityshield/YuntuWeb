#!/bin/bash

# 简化部署脚本 - 用于在阿里云服务器上快速部署
# 使用方法: ./deploy-simple.sh

echo "🚀 开始部署 yuntucv_web 项目..."

# 检查Python版本
echo "📋 检查Python环境..."
python3 --version

# 尝试安装标准依赖，如果失败则使用兼容版本
echo "📦 尝试安装Python依赖..."

if pip3 install -r requirements.txt; then
    echo "✅ 标准依赖安装成功"
else
    echo "⚠️  标准依赖安装失败，尝试兼容版本..."
    if pip3 install -r requirements-compatible.txt; then
        echo "✅ 兼容依赖安装成功"
    else
        echo "❌ 依赖安装失败，请检查Python版本和网络连接"
        exit 1
    fi
fi

# 检查端口占用
echo "🔍 检查端口占用..."
if netstat -tlnp | grep -q ":3001 "; then
    echo "⚠️  端口3001已被占用，正在停止现有服务..."
    pkill -f "proxy-server.py"
    sleep 2
fi

# 启动服务
echo "🎯 启动代理服务器..."
nohup python3 proxy-server.py > proxy-server.log 2>&1 &

# 等待服务启动
sleep 3

# 检查服务状态
echo "✅ 检查服务状态..."
if curl -s http://www.yuntucv.com:2345/api/health > /dev/null; then
    echo "🎉 服务启动成功！"
    echo "📍 前端地址: http://www.yuntucv.com:2345"
    echo "🔗 API地址: http://www.yuntucv.com:2345/api/aisr-process"
else
    echo "❌ 服务启动失败，请检查日志: proxy-server.log"
    echo "📋 查看日志: tail -f proxy-server.log"
    exit 1
fi

# 显示进程信息
echo "📊 服务进程信息:"
ps aux | grep proxy-server.py | grep -v grep

echo "✨ 部署完成！"
