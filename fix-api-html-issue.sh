#!/bin/bash

# 修复API返回HTML而不是JSON的问题
# 使用方法: ./fix-api-html-issue.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    修复API返回HTML问题${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查当前问题
echo -e "${YELLOW}1. 检查当前API响应...${NC}"
echo "测试健康检查API:"
curl -s http://localhost:3001/api/health | head -5
echo ""

echo "测试使用统计API:"
curl -s http://localhost:3001/api/usage-stats | head -5
echo ""

# 2. 检查代理服务器配置
echo -e "${YELLOW}2. 检查代理服务器配置...${NC}"
if [ -f "proxy-server.py" ]; then
    echo -e "${GREEN}✓ proxy-server.py 存在${NC}"
    
    # 检查是否有正确的路由配置
    if grep -q "@app.route('/api/health'" proxy-server.py; then
        echo -e "${GREEN}✓ 健康检查路由已配置${NC}"
    else
        echo -e "${RED}✗ 健康检查路由未配置${NC}"
    fi
    
    if grep -q "@app.route('/api/usage-stats'" proxy-server.py; then
        echo -e "${GREEN}✓ 使用统计路由已配置${NC}"
    else
        echo -e "${RED}✗ 使用统计路由未配置${NC}"
    fi
else
    echo -e "${RED}✗ proxy-server.py 不存在${NC}"
fi
echo ""

# 3. 重启代理服务器
echo -e "${YELLOW}3. 重启代理服务器...${NC}"
echo "停止现有服务..."
pkill -f 'proxy-server.py' || true
sleep 3

echo "启动新服务..."
nohup python3 proxy-server.py > proxy-server.log 2>&1 &
sleep 5

echo "检查服务状态..."
if ps aux | grep proxy-server | grep -v grep > /dev/null; then
    echo -e "${GREEN}✓ 代理服务器已启动${NC}"
else
    echo -e "${RED}✗ 代理服务器启动失败${NC}"
    echo "查看日志:"
    tail -10 proxy-server.log
fi
echo ""

# 4. 测试修复后的API
echo -e "${YELLOW}4. 测试修复后的API...${NC}"
echo "等待服务完全启动..."
sleep 3

echo "测试健康检查API:"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
echo "$HEALTH_RESPONSE"
echo ""

echo "测试使用统计API:"
STATS_RESPONSE=$(curl -s http://localhost:3001/api/usage-stats)
echo "$STATS_RESPONSE"
echo ""

# 5. 验证JSON响应
echo -e "${YELLOW}5. 验证JSON响应...${NC}"
if echo "$HEALTH_RESPONSE" | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 健康检查API返回有效JSON${NC}"
else
    echo -e "${RED}✗ 健康检查API返回无效JSON${NC}"
    echo "响应内容: $HEALTH_RESPONSE"
fi

if echo "$STATS_RESPONSE" | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 使用统计API返回有效JSON${NC}"
else
    echo -e "${RED}✗ 使用统计API返回无效JSON${NC}"
    echo "响应内容: $STATS_RESPONSE"
fi
echo ""

# 6. 检查Nginx配置（如果存在）
echo -e "${YELLOW}6. 检查Nginx配置...${NC}"
if command -v nginx &> /dev/null; then
    echo "检查Nginx状态..."
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓ Nginx正在运行${NC}"
        
        echo "检查Nginx配置..."
        if nginx -t 2>/dev/null; then
            echo -e "${GREEN}✓ Nginx配置正确${NC}"
        else
            echo -e "${YELLOW}⚠ Nginx配置可能有问题${NC}"
        fi
        
        echo "重新加载Nginx配置..."
        systemctl reload nginx
        echo -e "${GREEN}✓ Nginx配置已重新加载${NC}"
    else
        echo -e "${YELLOW}⚠ Nginx未运行${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Nginx未安装${NC}"
fi
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    修复完成${NC}"
echo -e "${BLUE}========================================${NC}"

# 提供测试建议
echo ""
echo -e "${YELLOW}💡 测试建议:${NC}"
echo "1. 访问测试页面: http://www.yuntucv.com/test-api-response-fixed.html"
echo "2. 测试AISR功能: http://www.yuntucv.com/aisr.html"
echo "3. 检查浏览器控制台是否有错误"
echo ""
echo -e "${YELLOW}🔍 监控命令:${NC}"
echo "1. 查看代理服务器日志: tail -f proxy-server.log"
echo "2. 检查进程状态: ps aux | grep proxy-server"
echo "3. 检查端口监听: netstat -tlnp | grep 3001"


