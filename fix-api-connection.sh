#!/bin/bash

echo "=== 修复API连接问题 ==="
echo "时间: $(date)"
echo ""

# 进入项目目录
cd /var/www/yuntucv_web

echo "1. 停止现有代理服务器..."
pkill -f "proxy-server.py"
sleep 3

echo "2. 检查代理服务器配置..."
if [ -f "proxy-server.py" ]; then
    echo "当前API_BASE_URL配置:"
    grep "API_BASE_URL" proxy-server.py
    echo ""
    
    # 确保配置正确
    sed -i "s|API_BASE_URL = '.*'|API_BASE_URL = 'http://www.yuntucv.com:2345'|g" proxy-server.py
    echo "已更新API_BASE_URL配置"
    grep "API_BASE_URL" proxy-server.py
else
    echo "错误: proxy-server.py 文件不存在"
    exit 1
fi
echo ""

echo "3. 测试后端API连接..."
curl -s --max-time 10 http://www.yuntucv.com:2345/api/v1/health/ && echo "✅ 后端API连接正常" || echo "❌ 后端API连接失败"
echo ""

echo "4. 启动代理服务器..."
nohup python3 proxy-server.py > proxy-server.log 2>&1 &
sleep 5

echo "5. 验证代理服务器状态..."
if ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo "✅ 代理服务器启动成功"
    ps aux | grep proxy-server | grep -v grep
else
    echo "❌ 代理服务器启动失败"
    echo "查看日志:"
    tail -20 proxy-server.log
    exit 1
fi
echo ""

echo "6. 测试代理服务器健康检查..."
curl -s http://www.yuntucv.com:2345/api/health && echo "✅ 代理服务器健康检查通过" || echo "❌ 代理服务器健康检查失败"
echo ""

echo "7. 重新加载nginx..."
systemctl reload nginx
echo "✅ nginx已重新加载"
echo ""

echo "=== 修复完成 ==="
echo "现在可以测试AISR功能了"
