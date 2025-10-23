#!/bin/bash

# 快速修复服务器脚本
# 使用方法: ./fix-server.sh

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
echo -e "${BLUE}    快速修复服务器脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查SSH连接
echo -e "${YELLOW}正在连接服务器...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器${NC}"
    exit 1
fi

echo -e "${GREEN}✓ SSH连接正常${NC}"
echo ""

# 执行修复步骤
echo -e "${YELLOW}开始修复服务器...${NC}"

# 1. 停止现有服务
echo "1. 停止现有服务..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '停止代理服务器...'
    pkill -f 'proxy-server.py' || true
    pkill -f 'python3.*proxy-server' || true
    sleep 3
"

# 2. 安装Python依赖
echo "2. 安装Python依赖..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '安装Python依赖...'
    pip3 install -r requirements.txt || pip3 install -r requirements-compatible.txt
"

# 3. 检查配置文件
echo "3. 检查配置文件..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '检查代理服务器配置...'
    if grep -q 'www.yuntucv.com:2345' proxy-server.py; then
        echo '✓ API配置正确'
    else
        echo '⚠ API配置可能有问题'
    fi
"

# 4. 启动服务
echo "4. 启动服务..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '启动代理服务器...'
    nohup python3 proxy-server.py > proxy-server.log 2>&1 &
    sleep 5
"

# 5. 验证服务
echo "5. 验证服务..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '检查进程状态...'
    ps aux | grep proxy-server | grep -v grep
    
    echo ''
    echo '检查端口监听...'
    netstat -tlnp | grep 3001
    
    echo ''
    echo '测试本地API...'
    sleep 2
    curl -s http://www.yuntucv.com:2345/api/health || echo '本地API测试失败'
"

# 6. 检查nginx配置
echo "6. 检查nginx配置..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    echo '检查nginx状态...'
    systemctl status nginx --no-pager -l | head -10
    
    echo ''
    echo '测试nginx配置...'
    nginx -t 2>&1 || echo 'nginx配置有错误'
    
    echo ''
    echo '重新加载nginx...'
    systemctl reload nginx || echo 'nginx重新加载失败'
"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    修复完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}测试访问:${NC}"
echo "  http://www.yuntucv.com/aisr.html"
echo "  http://59.110.51.85/aisr.html"
echo ""
echo -e "${BLUE}如果还有问题，请检查:${NC}"
echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
echo "  cd $SERVER_DIR"
echo "  tail -f proxy-server.log"
