#!/bin/bash

# 盛世云图代理服务器启动脚本
# 支持本地和服务器环境自动切换

echo "🚀 启动盛世云图代理服务器..."

# 加载配置
source ./config.sh

# 停止现有服务
echo "🛑 停止现有代理服务器..."
pkill -f "proxy-server.py"
sleep 3

# 启动代理服务器
echo "🌐 启动代理服务器..."
echo "📍 代理服务器地址: $PROXY_URL"
echo "🔗 后端API地址: $BACKEND_API_URL"

# 设置环境变量并启动
export DOMAIN
export PROXY_PORT
export API_PORT
export BACKEND_DOMAIN
export PROXY_URL
export API_URL
export BACKEND_API_URL
export PROXY_HEALTH_URL
export BACKEND_HEALTH_URL

nohup python3 proxy-server.py > proxy-server.log 2>&1 &
sleep 5

# 验证服务状态
echo "🔍 验证服务状态..."
if ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo "✅ 代理服务器启动成功"
    
    # 测试健康检查
    if curl -s $PROXY_HEALTH_URL > /dev/null; then
        echo "✅ 健康检查通过"
        echo "🎉 代理服务器运行正常！"
        echo ""
        echo "📋 服务信息："
        echo "   代理服务器: $PROXY_URL"
        echo "   健康检查: $PROXY_HEALTH_URL"
        echo "   后端API: $BACKEND_API_URL"
    else
        echo "❌ 健康检查失败"
        echo "查看日志: tail -f proxy-server.log"
    fi
else
    echo "❌ 代理服务器启动失败"
    echo "查看日志: tail -f proxy-server.log"
    exit 1
fi
