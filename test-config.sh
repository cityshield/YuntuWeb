#!/bin/bash

# 配置测试脚本
# 用于验证域名配置是否正确

echo "🔧 测试域名配置..."

# 加载配置
source ./config.sh

echo ""
echo "📋 当前配置信息："
echo "   域名: $DOMAIN"
echo "   代理端口: $PROXY_PORT"
echo "   API端口: $API_PORT"
echo "   代理URL: $PROXY_URL"
echo "   后端API: $BACKEND_API_URL"
echo ""

echo "🔍 测试连接..."

# 测试代理服务器
echo "1. 测试代理服务器健康检查..."
if curl -s --max-time 5 $PROXY_HEALTH_URL > /dev/null; then
    echo "✅ 代理服务器连接正常"
    curl -s $PROXY_HEALTH_URL | jq . 2>/dev/null || curl -s $PROXY_HEALTH_URL
else
    echo "❌ 代理服务器连接失败"
fi

echo ""

# 测试后端API
echo "2. 测试后端API连接..."
if curl -s --max-time 5 $BACKEND_HEALTH_URL > /dev/null; then
    echo "✅ 后端API连接正常"
    curl -s $BACKEND_HEALTH_URL | jq . 2>/dev/null || curl -s $BACKEND_HEALTH_URL
else
    echo "❌ 后端API连接失败"
fi

echo ""
echo "🎯 测试完成！"


