#!/bin/bash

# 部署脚本 - 用于在阿里云服务器上快速部署
# 使用方法: ./deploy.sh

echo "🚀 开始部署 yuntucv_web 项目..."

# 检查Python版本
echo "📋 检查Python环境..."
python3 --version

# 检查Python版本并选择合适的依赖文件
PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "🐍 Python版本: $PYTHON_VERSION"

# 根据Python版本选择依赖文件
if [[ $(echo "$PYTHON_VERSION >= 3.8" | bc -l) -eq 1 ]]; then
    echo "✅ 使用标准依赖文件"
    REQUIREMENTS_FILE="requirements.txt"
else
    echo "⚠️  Python版本较低，使用兼容性依赖文件"
    REQUIREMENTS_FILE="requirements-compatible.txt"
fi

# 安装依赖
echo "📦 安装Python依赖 ($REQUIREMENTS_FILE)..."
pip3 install -r $REQUIREMENTS_FILE

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
    exit 1
fi

# 显示进程信息
echo "📊 服务进程信息:"
ps aux | grep proxy-server.py | grep -v grep

echo "✨ 部署完成！"