#!/bin/bash

# 诊断API返回HTML而不是JSON的问题
# 使用方法: ./diagnose-api-issue.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    API问题诊断脚本${NC}"
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

# 3. 测试本地API响应
echo -e "${YELLOW}3. 测试本地API响应...${NC}"
echo "测试健康检查API:"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}\n%{content_type}" http://localhost:3001/api/health)
echo "$HEALTH_RESPONSE"
echo ""

echo "测试使用统计API:"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}\n%{content_type}" http://localhost:3001/api/usage-stats)
echo "$STATS_RESPONSE"
echo ""

# 4. 检查Nginx配置
echo -e "${YELLOW}4. 检查Nginx配置...${NC}"
if command -v nginx &> /dev/null; then
    echo "Nginx配置文件位置:"
    nginx -T 2>/dev/null | grep -E "(server|location|proxy_pass)" | head -20
else
    echo -e "${YELLOW}⚠ Nginx未安装或未在PATH中${NC}"
fi
echo ""

# 5. 检查代理服务器日志
echo -e "${YELLOW}5. 检查代理服务器日志...${NC}"
if [ -f "proxy-server.log" ]; then
    echo -e "${GREEN}✓ 日志文件存在${NC}"
    echo "最近20行日志:"
    tail -20 proxy-server.log
else
    echo -e "${YELLOW}⚠ 日志文件不存在${NC}"
fi
echo ""

# 6. 检查环境配置
echo -e "${YELLOW}6. 检查环境配置...${NC}"
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

# 7. 测试不同的URL路径
echo -e "${YELLOW}7. 测试不同的URL路径...${NC}"
echo "测试根路径:"
curl -s -I http://localhost:3001/ | head -5
echo ""

echo "测试API路径:"
curl -s -I http://localhost:3001/api/ | head -5
echo ""

# 8. 检查Python Flask应用
echo -e "${YELLOW}8. 检查Python Flask应用...${NC}"
if python3 -c "import flask" 2>/dev/null; then
    echo -e "${GREEN}✓ Flask已安装${NC}"
else
    echo -e "${RED}✗ Flask未安装${NC}"
fi

if python3 -c "import requests" 2>/dev/null; then
    echo -e "${GREEN}✓ requests已安装${NC}"
else
    echo -e "${RED}✗ requests未安装${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    诊断完成${NC}"
echo -e "${BLUE}========================================${NC}"

# 提供修复建议
echo ""
echo -e "${YELLOW}💡 可能的解决方案:${NC}"
echo "1. 如果API返回HTML，可能是Nginx配置问题"
echo "2. 检查Nginx是否将API请求正确代理到Flask应用"
echo "3. 确保Flask应用正确处理API路由"
echo "4. 检查防火墙和安全组设置"
echo ""
echo -e "${YELLOW}🔧 修复命令:${NC}"
echo "1. 重启代理服务器:"
echo "   pkill -f proxy-server.py && nohup python3 proxy-server.py > proxy-server.log 2>&1 &"
echo ""
echo "2. 检查Nginx配置:"
echo "   nginx -t"
echo "   systemctl reload nginx"
echo ""
echo "3. 查看详细日志:"
echo "   tail -f proxy-server.log"


