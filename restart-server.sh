#!/bin/bash

# 一键重启阿里云服务器脚本
# 使用方法: ./restart-server.sh

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
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    重启阿里云服务器服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查SSH连接
echo -e "${YELLOW}正在连接服务器...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器${NC}"
    echo "请检查:"
    echo "1. 服务器地址和端口是否正确"
    echo "2. SSH服务是否运行"
    echo "3. 防火墙设置"
    echo "4. 安全组配置"
    exit 1
fi

echo -e "${GREEN}✓ SSH连接正常${NC}"
echo ""

# 执行重启命令
echo -e "${YELLOW}开始重启服务...${NC}"

# 停止现有服务
echo "1. 停止现有服务..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '停止代理服务器...'
    pkill -f 'proxy-server.py' || true
    pkill -f 'python3.*proxy-server' || true
    sleep 3
    echo '检查进程状态...'
    ps aux | grep proxy-server | grep -v grep || echo '没有找到运行中的代理服务器进程'
"

# 检查端口占用
echo "2. 检查端口占用..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    echo '检查端口3001占用情况...'
    netstat -tlnp | grep 3001 || echo '端口3001未被占用'
"

# 重新启动服务
echo "3. 启动服务..."
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "
    cd $SERVER_DIR
    echo '启动代理服务器...'
    nohup python3 proxy-server.py > proxy-server.log 2>&1 &
    sleep 5
    echo '检查服务状态...'
    ps aux | grep proxy-server | grep -v grep
    echo '检查端口监听...'
    netstat -tlnp | grep 3001
"

# 测试服务健康状态
echo "4. 测试服务健康状态..."
sleep 3
if curl -s http://$SERVER_HOST:3001/api/health > /dev/null; then
    echo -e "${GREEN}✓ 服务启动成功${NC}"
    echo -e "${GREEN}✓ 健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠ 服务可能还在启动中，请稍后检查${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    服务重启完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}访问地址:${NC}"
echo "  http://$SERVER_HOST"
echo "  http://www.yuntucv.com"
echo "  http://$SERVER_HOST:3001"
echo ""
echo -e "${BLUE}检查服务状态:${NC}"
echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
echo "  cd $SERVER_DIR"
echo "  tail -f proxy-server.log"
echo ""
echo -e "${BLUE}如果服务未正常启动，请检查:${NC}"
echo "  1. Python依赖是否安装完整"
echo "  2. 端口3001是否被其他服务占用"
echo "  3. 防火墙和安全组设置"
echo "  4. 查看日志: tail -f proxy-server.log"


