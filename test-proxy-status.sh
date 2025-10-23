#!/bin/bash

# 测试代理服务器状态脚本
# 使用方法: ./test-proxy-status.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    代理服务器状态检查${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查代理服务器进程
echo -e "${YELLOW}1. 检查代理服务器进程...${NC}"
if ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo -e "${GREEN}✓ 代理服务器进程正在运行${NC}"
    ps aux | grep proxy-server | grep -v grep
else
    echo -e "${RED}✗ 代理服务器进程未运行${NC}"
fi
echo ""

# 2. 检查端口监听
echo -e "${YELLOW}2. 检查端口3001监听状态...${NC}"
if netstat -tlnp | grep 3001 > /dev/null; then
    echo -e "${GREEN}✓ 端口3001正在监听${NC}"
    netstat -tlnp | grep 3001
else
    echo -e "${RED}✗ 端口3001未在监听${NC}"
fi
echo ""

# 3. 测试健康检查API
echo -e "${YELLOW}3. 测试健康检查API...${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 健康检查API响应正常 (HTTP $HTTP_CODE)${NC}"
    echo "响应内容: $RESPONSE_BODY"
else
    echo -e "${RED}✗ 健康检查API响应异常 (HTTP $HTTP_CODE)${NC}"
    echo "响应内容: $RESPONSE_BODY"
fi
echo ""

# 4. 测试使用统计API
echo -e "${YELLOW}4. 测试使用统计API...${NC}"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/usage-stats)
STATS_HTTP_CODE=$(echo "$STATS_RESPONSE" | tail -n1)
STATS_BODY=$(echo "$STATS_RESPONSE" | head -n -1)

if [ "$STATS_HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 使用统计API响应正常 (HTTP $STATS_HTTP_CODE)${NC}"
    echo "响应内容: $STATS_BODY"
else
    echo -e "${RED}✗ 使用统计API响应异常 (HTTP $STATS_HTTP_CODE)${NC}"
    echo "响应内容: $STATS_BODY"
fi
echo ""

# 5. 检查日志文件
echo -e "${YELLOW}5. 检查代理服务器日志...${NC}"
if [ -f "proxy-server.log" ]; then
    echo -e "${GREEN}✓ 日志文件存在${NC}"
    echo "最近10行日志:"
    tail -10 proxy-server.log
else
    echo -e "${YELLOW}⚠ 日志文件不存在${NC}"
fi
echo ""

# 6. 检查Python环境
echo -e "${YELLOW}6. 检查Python环境...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python版本: $PYTHON_VERSION${NC}"
    
    # 检查依赖
    if python3 -c "import flask, requests, PIL" 2>/dev/null; then
        echo -e "${GREEN}✓ Python依赖检查通过${NC}"
    else
        echo -e "${RED}✗ Python依赖缺失${NC}"
        echo "请运行: pip3 install -r requirements-no-exr.txt"
    fi
else
    echo -e "${RED}✗ Python3 未安装${NC}"
fi
echo ""

# 7. 检查环境配置
echo -e "${YELLOW}7. 检查环境配置...${NC}"
if [ -f "config.sh" ]; then
    echo -e "${GREEN}✓ 配置文件存在${NC}"
    source ./config.sh
    echo "当前配置:"
    echo "  DOMAIN: $DOMAIN"
    echo "  PROXY_PORT: $PROXY_PORT"
    echo "  BACKEND_DOMAIN: $BACKEND_DOMAIN"
    echo "  BACKEND_API_URL: $BACKEND_API_URL"
else
    echo -e "${YELLOW}⚠ 配置文件不存在${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    状态检查完成${NC}"
echo -e "${BLUE}========================================${NC}"

# 提供修复建议
if ! ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo ""
    echo -e "${YELLOW}💡 修复建议:${NC}"
    echo "1. 启动代理服务器:"
    echo "   nohup python3 proxy-server.py > proxy-server.log 2>&1 &"
    echo ""
    echo "2. 或者使用启动脚本:"
    echo "   ./start-proxy.sh"
    echo ""
    echo "3. 检查日志:"
    echo "   tail -f proxy-server.log"
fi


