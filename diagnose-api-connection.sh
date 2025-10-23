#!/bin/bash

echo "=== API连接诊断脚本 ==="
echo "时间: $(date)"
echo ""

echo "1. 检查代理服务器进程..."
ps aux | grep proxy-server | grep -v grep
echo ""

echo "2. 检查代理服务器端口..."
netstat -tlnp | grep 3001
echo ""

echo "3. 测试代理服务器健康检查..."
curl -s http://www.yuntucv.com:2345/api/health | jq . 2>/dev/null || curl -s http://www.yuntucv.com:2345/api/health
echo ""

echo "4. 测试后端API连接..."
curl -s http://www.yuntucv.com:2345/api/v1/health/ | jq . 2>/dev/null || curl -s http://www.yuntucv.com:2345/api/v1/health/
echo ""

echo "5. 检查代理服务器配置..."
if [ -f "proxy-server.py" ]; then
    echo "代理服务器文件存在"
    grep "API_BASE_URL" proxy-server.py
else
    echo "代理服务器文件不存在"
fi
echo ""

echo "6. 测试代理服务器到后端的连接..."
curl -s -X POST http://www.yuntucv.com:2345/api/aisr-process \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}' \
  --max-time 10
echo ""

echo "=== 诊断完成 ==="
