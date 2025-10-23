#!/bin/bash

# 环境切换脚本
# 快速在本地和服务器环境之间切换

if [ "$1" = "local" ]; then
    echo "🔄 切换到本地开发环境..."
    
    # 注释掉服务器配置
    sed -i '' 's/^DOMAIN=\$SERVER_DOMAIN/#DOMAIN=\$SERVER_DOMAIN/' config.sh
    sed -i '' 's/^PROXY_PORT=\$SERVER_PROXY_PORT/#PROXY_PORT=\$SERVER_PROXY_PORT/' config.sh
    sed -i '' 's/^API_PORT=\$SERVER_API_PORT/#API_PORT=\$SERVER_API_PORT/' config.sh
    sed -i '' 's/^BACKEND_DOMAIN=\$SERVER_BACKEND_DOMAIN/#BACKEND_DOMAIN=\$SERVER_BACKEND_DOMAIN/' config.sh
    
    # 启用本地配置
    sed -i '' 's/^#DOMAIN=\$LOCAL_DOMAIN/DOMAIN=\$LOCAL_DOMAIN/' config.sh
    sed -i '' 's/^#PROXY_PORT=\$LOCAL_PROXY_PORT/PROXY_PORT=\$LOCAL_PROXY_PORT/' config.sh
    sed -i '' 's/^#API_PORT=\$LOCAL_API_PORT/API_PORT=\$LOCAL_API_PORT/' config.sh
    sed -i '' 's/^#BACKEND_DOMAIN=\$LOCAL_BACKEND_DOMAIN/BACKEND_DOMAIN=\$LOCAL_BACKEND_DOMAIN/' config.sh
    
    echo "✅ 已切换到本地环境"
    echo "📍 代理服务器: http://localhost:3001"
    echo "🔗 后端API: http://192.168.99.49:2345"
    
elif [ "$1" = "server" ]; then
    echo "🔄 切换到服务器生产环境..."
    
    # 注释掉本地配置
    sed -i '' 's/^DOMAIN=\$LOCAL_DOMAIN/#DOMAIN=\$LOCAL_DOMAIN/' config.sh
    sed -i '' 's/^PROXY_PORT=\$LOCAL_PROXY_PORT/#PROXY_PORT=\$LOCAL_PROXY_PORT/' config.sh
    sed -i '' 's/^API_PORT=\$LOCAL_API_PORT/#API_PORT=\$LOCAL_API_PORT/' config.sh
    sed -i '' 's/^BACKEND_DOMAIN=\$LOCAL_BACKEND_DOMAIN/#BACKEND_DOMAIN=\$LOCAL_BACKEND_DOMAIN/' config.sh
    
    # 启用服务器配置
    sed -i '' 's/^#DOMAIN=\$SERVER_DOMAIN/DOMAIN=\$SERVER_DOMAIN/' config.sh
    sed -i '' 's/^#PROXY_PORT=\$SERVER_PROXY_PORT/PROXY_PORT=\$SERVER_PROXY_PORT/' config.sh
    sed -i '' 's/^#API_PORT=\$SERVER_API_PORT/API_PORT=\$SERVER_API_PORT/' config.sh
    sed -i '' 's/^#BACKEND_DOMAIN=\$SERVER_BACKEND_DOMAIN/BACKEND_DOMAIN=\$SERVER_BACKEND_DOMAIN/' config.sh
    
    echo "✅ 已切换到服务器环境"
    echo "📍 代理服务器: http://www.yuntucv.com:3001"
    echo "🔗 后端API: http://www.yuntucv.com:2345"
    
else
    echo "❌ 用法: $0 [local|server]"
    echo ""
    echo "示例："
    echo "  $0 local   # 切换到本地开发环境"
    echo "  $0 server  # 切换到服务器生产环境"
    echo ""
    echo "当前配置："
    source ./config.sh
    exit 1
fi

echo ""
echo "🔍 当前配置："
source ./config.sh
