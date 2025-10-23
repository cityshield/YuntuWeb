#!/bin/bash

# 服务器诊断脚本
# 使用方法: ./diagnose-server.sh

set -e

# 服务器配置
SERVER_HOST="59.110.51.85"
SERVER_PORT="777"
SERVER_USER="root"
SERVER_DIR="/var/www/yuntucv_web"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    服务器诊断脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查SSH连接
echo -e "${YELLOW}1. 检查SSH连接...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH连接正常${NC}"
else
    echo -e "${RED}✗ SSH连接失败${NC}"
    exit 1
fi

echo ""

# 检查服务状态
echo -e "${YELLOW}2. 检查服务状态...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    echo '检查Python进程...'
    ps aux | grep python3 | grep -v grep || echo '没有找到Python进程'
    
    echo ''
    echo '检查代理服务器进程...'
    ps aux | grep proxy-server | grep -v grep || echo '没有找到代理服务器进程'
    
    echo ''
    echo '检查端口3001...'
    netstat -tlnp | grep 3001 || echo '端口3001未被占用'
    
    echo ''
    echo '检查nginx状态...'
    systemctl status nginx --no-pager -l || echo 'nginx未运行'
"

echo ""

# 检查文件
echo -e "${YELLOW}3. 检查项目文件...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '检查项目目录...'
    ls -la | head -10
    
    echo ''
    echo '检查代理服务器文件...'
    ls -la proxy-server.py
    
    echo ''
    echo '检查Python依赖...'
    python3 -c 'import flask, requests, PIL' 2>/dev/null && echo 'Python依赖正常' || echo 'Python依赖缺失'
"

echo ""

# 检查日志
echo -e "${YELLOW}4. 检查服务日志...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '检查代理服务器日志...'
    if [ -f proxy-server.log ]; then
        echo '最近10行日志:'
        tail -10 proxy-server.log
    else
        echo '没有找到日志文件'
    fi
    
    echo ''
    echo '检查nginx错误日志...'
    if [ -f /var/log/nginx/error.log ]; then
        echo '最近5行nginx错误日志:'
        tail -5 /var/log/nginx/error.log
    else
        echo '没有找到nginx错误日志'
    fi
"

echo ""

# 测试API
echo -e "${YELLOW}5. 测试API连接...${NC}"
echo "测试本地API..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '测试本地3001端口...'
    curl -s http://www.yuntucv.com:2345/api/health || echo '本地3001端口无法访问'
    
    echo ''
    echo '测试后端API...'
    curl -s http://www.yuntucv.com:2345/api/v1/health/ || echo '后端API无法访问'
"

echo ""

# 检查nginx配置
echo -e "${YELLOW}6. 检查nginx配置...${NC}"
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    echo '检查nginx配置文件...'
    if [ -f /etc/nginx/sites-available/yuntucv.com ]; then
        echo 'yuntucv.com配置文件:'
        cat /etc/nginx/sites-available/yuntucv.com
    else
        echo '没有找到yuntucv.com配置文件'
    fi
    
    echo ''
    echo '检查nginx配置语法...'
    nginx -t 2>&1 || echo 'nginx配置有错误'
"

echo ""

# 提供解决方案
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    诊断完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}可能的解决方案:${NC}"
echo "1. 如果代理服务器未运行:"
echo "   cd $SERVER_DIR && python3 proxy-server.py &"
echo ""
echo "2. 如果Python依赖缺失:"
echo "   pip3 install -r requirements.txt"
echo ""
echo "3. 如果nginx配置有问题:"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "4. 如果端口被占用:"
echo "   pkill -f proxy-server && sleep 3 && python3 proxy-server.py &"
