#!/bin/bash

# 使用密码认证的服务器修复脚本
# 使用方法: ./fix-server-with-password.sh

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
echo -e "${BLUE}    服务器修复脚本 (密码认证)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${YELLOW}注意: 此脚本需要您手动输入服务器密码${NC}"
echo ""

# 检查网络连接
echo -e "${YELLOW}1. 检查网络连接...${NC}"
if ping -c 1 $SERVER_HOST > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 网络连接正常${NC}"
else
    echo -e "${RED}✗ 网络连接失败${NC}"
    exit 1
fi

# 检查端口
echo -e "${YELLOW}2. 检查SSH端口...${NC}"
if nc -z $SERVER_HOST $SERVER_PORT 2>/dev/null; then
    echo -e "${GREEN}✓ SSH端口开放${NC}"
else
    echo -e "${RED}✗ SSH端口不可达${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}3. 开始修复服务器...${NC}"
echo "请按照提示输入服务器密码 (Yuntu123)"
echo ""

# 执行修复命令
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'EOF'
    echo "=== 进入项目目录 ==="
    cd /var/www/yuntucv_web
    
    echo "=== 停止现有服务 ==="
    pkill -f "proxy-server.py" || true
    pkill -f "python3.*proxy-server" || true
    sleep 3
    
    echo "=== 检查Python依赖 ==="
    python3 -c "import flask, requests, PIL" 2>/dev/null && echo "Python依赖正常" || {
        echo "安装Python依赖..."
        pip3 install -r requirements.txt || pip3 install -r requirements-compatible.txt
    }
    
    echo "=== 检查配置文件 ==="
    if grep -q "www.yuntucv.com:2345" proxy-server.py; then
        echo "✓ API配置正确"
    else
        echo "⚠ 需要检查API配置"
    fi
    
    echo "=== 启动代理服务器 ==="
    nohup python3 proxy-server.py > proxy-server.log 2>&1 &
    sleep 5
    
    echo "=== 验证服务状态 ==="
    echo "检查进程:"
    ps aux | grep proxy-server | grep -v grep || echo "没有找到代理服务器进程"
    
    echo ""
    echo "检查端口:"
    netstat -tlnp | grep 3001 || echo "端口3001未被监听"
    
    echo ""
    echo "测试API:"
    sleep 2
    curl -s http://www.yuntucv.com:2345/api/health || echo "API测试失败"
    
    echo ""
    echo "=== 检查nginx ==="
    systemctl status nginx --no-pager -l | head -5
    
    echo ""
    echo "=== 修复完成 ==="
    echo "请访问 http://www.yuntucv.com/aisr.html 测试功能"
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    修复脚本执行完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}测试访问:${NC}"
echo "  http://www.yuntucv.com/aisr.html"
echo "  http://59.110.51.85/aisr.html"
echo ""
echo -e "${BLUE}如果还有问题，请查看:${NC}"
echo "  ssh -p 777 root@59.110.51.85"
echo "  cd /var/www/yuntucv_web"
echo "  tail -f proxy-server.log"
