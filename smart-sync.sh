#!/bin/bash

# 智能同步脚本 - 盛世云图网站
# 使用方法: ./smart-sync.sh
# 功能: 自动切换环境、处理SSH连接、同步文件

# 服务器配置
SERVER="root@59.110.51.85"
PORT="777"
DIR="/var/www/yuntucv_web"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    智能同步脚本 - 盛世云图网站${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 自动切换到服务器环境
echo -e "${YELLOW}🔄 自动切换到服务器环境...${NC}"
if [ -f "./switch-env.sh" ]; then
    ./switch-env.sh server > /dev/null 2>&1
    echo -e "${GREEN}✓ 已切换到服务器环境${NC}"
else
    echo -e "${YELLOW}⚠️  警告: switch-env.sh 未找到，请手动确保服务器环境配置已启用${NC}"
fi
echo ""

# 2. 检查SSH连接
echo -e "${YELLOW}🔍 检查SSH连接...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $PORT $SERVER "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH连接正常${NC}"
    SSH_READY=true
else
    echo -e "${RED}✗ SSH连接失败${NC}"
    echo -e "${YELLOW}可能的原因:${NC}"
    echo "  1. 服务器地址或端口错误"
    echo "  2. SSH服务未运行"
    echo "  3. 防火墙阻止连接"
    echo "  4. 需要密码认证"
    echo ""
    echo -e "${YELLOW}尝试使用密码认证...${NC}"
    
    # 尝试使用sshpass进行密码认证
    if command -v sshpass &> /dev/null; then
        echo "使用sshpass进行密码认证..."
        SSH_READY=false
    else
        echo -e "${RED}sshpass未安装，无法进行密码认证${NC}"
        echo "请安装sshpass或配置SSH密钥认证"
        SSH_READY=false
    fi
fi
echo ""

# 3. 执行同步
if [ "$SSH_READY" = true ]; then
    echo -e "${YELLOW}🚀 开始同步文件...${NC}"
    echo "服务器: $SERVER:$PORT"
    echo "目录: $DIR"
    echo ""
    
    rsync -avz --progress \
        -e "ssh -p $PORT" \
        --exclude='node_modules/' \
        --exclude='.git/' \
        --exclude='.vite/' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='*.tmp' \
        ./ $SERVER:$DIR/
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 同步完成!${NC}"
        echo -e "${BLUE}🌐 访问地址:${NC}"
        echo "  http://59.110.51.85"
        echo "  http://www.yuntucv.com"
        echo ""
        echo -e "${YELLOW}💡 提示: 如需重启服务器端服务，请运行:${NC}"
        echo "  ssh -p $PORT $SERVER 'cd $DIR && ./restart-server.sh'"
    else
        echo ""
        echo -e "${RED}❌ 同步失败${NC}"
        echo "请检查错误信息并重试"
    fi
    
elif command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}🔐 使用密码认证进行同步...${NC}"
    echo "请输入服务器密码:"
    
    rsync -avz --progress \
        -e "sshpass -p 'Yuntu123' ssh -p $PORT" \
        --exclude='node_modules/' \
        --exclude='.git/' \
        --exclude='.vite/' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='*.tmp' \
        ./ $SERVER:$DIR/
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 同步完成!${NC}"
        echo -e "${BLUE}🌐 访问地址:${NC}"
        echo "  http://59.110.51.85"
        echo "  http://www.yuntucv.com"
    else
        echo ""
        echo -e "${RED}❌ 同步失败${NC}"
        echo "请检查密码或服务器状态"
    fi
    
else
    echo -e "${RED}❌ 无法建立SSH连接${NC}"
    echo ""
    echo -e "${YELLOW}解决方案:${NC}"
    echo "1. 安装sshpass: brew install sshpass (macOS) 或 apt-get install sshpass (Ubuntu)"
    echo "2. 配置SSH密钥认证"
    echo "3. 检查服务器SSH服务状态"
    echo "4. 检查防火墙和安全组设置"
    echo ""
    echo -e "${BLUE}手动连接测试:${NC}"
    echo "ssh -p $PORT $SERVER"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    同步脚本执行完成${NC}"
echo -e "${BLUE}========================================${NC}"


