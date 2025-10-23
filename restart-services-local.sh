#!/bin/bash

# 在服务器上直接重启服务脚本
# 使用方法: ./restart-services-local.sh
# 注意: 此脚本需要在服务器上直接运行，不需要SSH连接

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    重启服务器端服务${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查当前目录
CURRENT_DIR=$(pwd)
echo -e "${YELLOW}当前目录: $CURRENT_DIR${NC}"

# 检查必要文件
if [ ! -f "proxy-server.py" ]; then
    echo -e "${RED}错误: proxy-server.py 文件未找到${NC}"
    echo "请确保在正确的项目目录中运行此脚本"
    exit 1
fi

echo -e "${GREEN}✓ 项目文件检查通过${NC}"
echo ""

# 1. 停止现有服务
echo -e "${YELLOW}1. 停止现有服务...${NC}"
echo "停止代理服务器进程..."
pkill -f 'proxy-server.py' || true
pkill -f 'python3.*proxy-server' || true
sleep 3

echo "检查进程状态..."
if ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo -e "${YELLOW}⚠ 仍有代理服务器进程在运行，强制终止...${NC}"
    pkill -9 -f 'proxy-server.py' || true
    sleep 2
fi

echo -e "${GREEN}✓ 服务已停止${NC}"
echo ""

# 2. 检查端口占用
echo -e "${YELLOW}2. 检查端口占用...${NC}"
if netstat -tlnp | grep 3001 > /dev/null; then
    echo -e "${YELLOW}⚠ 端口3001仍被占用:${NC}"
    netstat -tlnp | grep 3001
    echo "尝试释放端口..."
    fuser -k 3001/tcp || true
    sleep 2
else
    echo -e "${GREEN}✓ 端口3001已释放${NC}"
fi
echo ""

# 3. 检查Python环境
echo -e "${YELLOW}3. 检查Python环境...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python版本: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}错误: Python3 未安装${NC}"
    exit 1
fi

# 检查依赖
echo "检查Python依赖..."
if python3 -c "import flask, requests, PIL" 2>/dev/null; then
    echo -e "${GREEN}✓ Python依赖检查通过${NC}"
else
    echo -e "${YELLOW}⚠ 部分Python依赖缺失，尝试安装...${NC}"
    if [ -f "requirements-no-exr.txt" ]; then
        pip3 install -r requirements-no-exr.txt
    elif [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    else
        echo -e "${RED}错误: 未找到requirements文件${NC}"
        exit 1
    fi
fi
echo ""

# 4. 启动服务
echo -e "${YELLOW}4. 启动服务...${NC}"

# 加载环境配置
if [ -f "config.sh" ]; then
    echo "加载环境配置..."
    source ./config.sh
    echo -e "${GREEN}✓ 环境配置已加载${NC}"
else
    echo -e "${YELLOW}⚠ config.sh 未找到，使用默认配置${NC}"
fi

echo "启动代理服务器..."
nohup python3 proxy-server.py > proxy-server.log 2>&1 &
sleep 5

echo "检查服务状态..."
if ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo -e "${GREEN}✓ 代理服务器已启动${NC}"
    ps aux | grep proxy-server | grep -v grep
else
    echo -e "${RED}✗ 代理服务器启动失败${NC}"
    echo "查看日志:"
    tail -20 proxy-server.log
    exit 1
fi

echo ""
echo "检查端口监听..."
if netstat -tlnp | grep 3001 > /dev/null; then
    echo -e "${GREEN}✓ 端口3001正在监听${NC}"
    netstat -tlnp | grep 3001
else
    echo -e "${RED}✗ 端口3001未在监听${NC}"
fi
echo ""

# 5. 测试服务健康状态
echo -e "${YELLOW}5. 测试服务健康状态...${NC}"
sleep 3

# 获取服务器IP
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="localhost"
fi

echo "测试健康检查端点..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✓ 本地健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠ 本地健康检查失败，检查日志...${NC}"
    tail -10 proxy-server.log
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    服务重启完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}服务信息:${NC}"
echo "  代理服务器: http://localhost:3001"
echo "  服务器IP: http://$SERVER_IP:3001"
echo "  域名: http://www.yuntucv.com:3001"
echo ""
echo -e "${BLUE}监控命令:${NC}"
echo "  查看日志: tail -f proxy-server.log"
echo "  检查进程: ps aux | grep proxy-server"
echo "  检查端口: netstat -tlnp | grep 3001"
echo "  健康检查: curl http://localhost:3001/api/health"
echo ""
echo -e "${BLUE}如果服务异常，请检查:${NC}"
echo "  1. 日志文件: tail -f proxy-server.log"
echo "  2. Python依赖: pip3 list"
echo "  3. 端口占用: netstat -tlnp | grep 3001"
echo "  4. 防火墙: firewall-cmd --list-ports"


