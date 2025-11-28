#!/bin/bash

# ========================================
# 盛世云图Web应用 - 统一同步脚本
# ========================================
# 功能：
# 1. 自动切换到服务器环境
# 2. 同步代码到阿里云服务器
# 3. 显示同步文件范围（中文）
# 4. 自动重启服务
# 5. 验证服务状态
# ========================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 服务器配置
SERVER_HOST="59.110.51.85"
SERVER_PORT="777"
SERVER_USER="root"
SERVER_DIR="/var/www/yuntucv_web"

# ========================================
# 打印标题
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    盛世云图Web应用 - 统一同步脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========================================
# 步骤1: 自动切换到服务器环境
# ========================================
echo -e "${YELLOW}[步骤1/6] 自动切换到服务器环境...${NC}"
if [ -f "./switch-env.sh" ]; then
    ./switch-env.sh server > /dev/null 2>&1
    echo -e "${GREEN}✓ 已切换到服务器环境${NC}"
else
    echo -e "${YELLOW}⚠️  警告: switch-env.sh 未找到${NC}"
    echo -e "${CYAN}   请确保服务器环境配置已手动启用${NC}"
fi
echo ""

# ========================================
# 步骤2: 检查SSH连接
# ========================================
echo -e "${YELLOW}[步骤2/6] 检查服务器连接...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${RED}✗ 无法连接到服务器${NC}"
    echo ""
    echo -e "${YELLOW}可能的原因：${NC}"
    echo "  1. 服务器地址或端口错误"
    echo "  2. SSH服务未运行"
    echo "  3. 防火墙阻止连接"
    echo "  4. SSH密钥未配置"
    echo ""
    echo -e "${CYAN}手动连接测试：${NC}"
    echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
    exit 1
fi

echo -e "${GREEN}✓ SSH连接正常${NC}"
echo ""

# ========================================
# 步骤3: 同步文件
# ========================================
echo -e "${YELLOW}[步骤3/6] 同步文件到服务器...${NC}"
echo -e "${CYAN}服务器: $SERVER_USER@$SERVER_HOST:$SERVER_PORT${NC}"
echo -e "${CYAN}目录: $SERVER_DIR${NC}"
echo ""

# 记录同步开始时间
SYNC_START_TIME=$(date +%s)

# 执行同步
rsync -avz --progress \
    -e "ssh -p $SERVER_PORT" \
    --exclude='node_modules/' \
    --exclude='.git/' \
    --exclude='.vite/' \
    --exclude='.claude/' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='*.tmp' \
    --exclude='*.swp' \
    --exclude='.env' \
    --exclude='dist/' \
    --exclude='build/' \
    --exclude='quick-sync.sh' \
    --exclude='smart-sync.sh' \
    --exclude='sync-modified-files.sh' \
    --exclude='sync-restart-script.sh' \
    --exclude='sync-to-server.sh' \
    --exclude='deploy-simple.sh' \
    --exclude='deploy.sh' \
    ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/ > /tmp/rsync_output.txt 2>&1

SYNC_EXIT_CODE=$?
SYNC_END_TIME=$(date +%s)
SYNC_DURATION=$((SYNC_END_TIME - SYNC_START_TIME))

if [ $SYNC_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}✗ 同步失败${NC}"
    cat /tmp/rsync_output.txt
    exit 1
fi

# ========================================
# 步骤4: 显示同步文件范围（中文）
# ========================================
echo ""
echo -e "${YELLOW}[步骤4/6] 同步结果统计...${NC}"

# 统计同步的文件
SYNCED_FILES=$(grep -E "^(sending|sent)" /tmp/rsync_output.txt | tail -5)
FILE_COUNT=$(grep -c "^sending" /tmp/rsync_output.txt 2>/dev/null || echo "0")

echo -e "${GREEN}✓ 同步完成！${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}同步时间：${NC}$(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${CYAN}耗时：${NC}${SYNC_DURATION}秒"

# 显示主要同步的文件类型
echo ""
echo -e "${CYAN}主要同步内容：${NC}"
echo "  📄 HTML文件     - 网页页面"
echo "  🎨 CSS文件      - 样式表"
echo "  ⚙️  JS文件       - JavaScript脚本"
echo "  🐍 Python文件   - 后端服务"
echo "  🖼️  图片文件     - 图标和图片资源"
echo "  🔧 配置文件     - requirements.txt等"
echo "  📝 组件文件     - header/footer组件"

echo ""
echo -e "${CYAN}排除的内容：${NC}"
echo "  • node_modules  - Node依赖包"
echo "  • .git          - Git版本控制"
echo "  • .claude       - Claude配置"
echo "  • *.log         - 日志文件"
echo "  • 旧的同步脚本  - 已废弃的脚本"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ========================================
# 步骤5: 自动重启服务
# ========================================
echo -e "${YELLOW}[步骤5/6] 自动重启服务器服务...${NC}"

# 检查服务器上是否有restart-server.sh
if ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "[ -f $SERVER_DIR/restart-server.sh ]"; then
    echo -e "${CYAN}正在重启服务...${NC}"

    # 执行远程重启脚本
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && bash restart-server.sh" 2>&1 | while IFS= read -r line; do
        # 过滤掉SSH相关的警告信息
        if [[ ! "$line" =~ "Pseudo-terminal" ]] && [[ ! "$line" =~ "no job control" ]]; then
            echo "  $line"
        fi
    done

    echo -e "${GREEN}✓ 服务重启完成${NC}"
else
    echo -e "${YELLOW}⚠️  警告: restart-server.sh 未找到，需要手动重启${NC}"
    echo -e "${CYAN}手动重启命令：${NC}"
    echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
    echo "  cd $SERVER_DIR"
    echo "  pkill -9 -f proxy-server.py"
    echo "  pip3 install -r requirements.txt"
    echo "  nohup python3 proxy-server.py > proxy.log 2>&1 &"
fi

echo ""

# ========================================
# 步骤6: 验证服务状态
# ========================================
echo -e "${YELLOW}[步骤6/6] 验证服务状态...${NC}"

# 等待服务启动
sleep 3

# 检查服务进程
echo -e "${CYAN}检查服务进程...${NC}"
if ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "ps aux | grep proxy-server.py | grep -v grep" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ proxy-server.py 进程运行正常${NC}"
else
    echo -e "${RED}✗ proxy-server.py 进程未运行${NC}"
    echo -e "${YELLOW}请检查服务器日志${NC}"
fi

# 检查端口监听
echo -e "${CYAN}检查端口监听...${NC}"
if ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "netstat -tlnp 2>/dev/null | grep :3001" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 端口 3001 正在监听${NC}"
else
    echo -e "${RED}✗ 端口 3001 未监听${NC}"
    echo -e "${YELLOW}服务可能启动失败${NC}"
fi

echo ""

# ========================================
# 完成
# ========================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}    同步和部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📍 访问地址：${NC}"
echo "  🌐 HTTP:  http://$SERVER_HOST"
echo "  🔒 HTTPS: https://www.yuntucv.com"
echo "  ⚙️  API:   http://$SERVER_HOST:3001"
echo ""
echo -e "${BLUE}🔍 查看服务日志：${NC}"
echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
echo "  cd $SERVER_DIR"
echo "  tail -f proxy.log"
echo ""
echo -e "${BLUE}⚡ 快速重启服务：${NC}"
echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST 'cd $SERVER_DIR && bash restart-server.sh'"
echo ""
