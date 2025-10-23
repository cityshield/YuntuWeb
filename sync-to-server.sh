#!/bin/bash

# 盛世云图网站 - 自动同步到阿里云服务器脚本
# 使用方法: ./sync-to-server.sh

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器配置
SERVER_HOST="59.110.51.85"
SERVER_PORT="777"
SERVER_USER="root"
SERVER_DIR="/var/www/yuntucv_web"
LOCAL_DIR="."

# 需要同步的文件和目录
SYNC_ITEMS=(
    "*.html"
    "styles/"
    "scripts/"
    "components/"
    "images/"
    "*.py"
    "*.txt"
    "*.md"
    "*.sh"
    "*.js"
    "*.css"
    "*.json"
    "*.svg"
    "*.png"
    "*.jpg"
    "*.jpeg"
    "*.gif"
    "*.ico"
    "*.webp"
    "*.tiff"
    "*.bmp"
    "*.exr"
)

# 排除的文件和目录
EXCLUDE_ITEMS=(
    "node_modules/"
    ".git/"
    ".vite/"
    "*.log"
    "*.tmp"
    ".DS_Store"
    "Thumbs.db"
    "*.swp"
    "*.swo"
    "*~"
    ".env"
    ".env.local"
    ".env.production"
    "dist/"
    "build/"
    "coverage/"
    ".nyc_output/"
    "*.pid"
    "*.seed"
    "*.pid.lock"
    "npm-debug.log*"
    "yarn-debug.log*"
    "yarn-error.log*"
    "lerna-debug.log*"
    ".npm"
    ".eslintcache"
    ".stylelintcache"
    ".rpt2_cache/"
    ".rts2_cache_cjs/"
    ".rts2_cache_es/"
    ".rts2_cache_umd/"
    ".cache/"
    ".parcel-cache/"
    ".next/"
    ".nuxt/"
    ".vuepress/dist/"
    ".serverless/"
    ".fusebox/"
    ".dynamodb/"
    ".tern-port"
    ".vscode-test/"
    "*.tgz"
    ".yarn-integrity"
    ".env.test"
    ".env.production.local"
    ".env.test.local"
    ".env.development.local"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    盛世云图网站 - 自动同步脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 自动切换到服务器环境
echo -e "${YELLOW}🔄 自动切换到服务器环境...${NC}"
if [ -f "./switch-env.sh" ]; then
    ./switch-env.sh server > /dev/null 2>&1
    echo -e "${GREEN}✓ 已切换到服务器环境${NC}"
else
    echo -e "${YELLOW}⚠️  警告: switch-env.sh 未找到，请手动确保服务器环境配置已启用${NC}"
fi
echo ""

# 检查rsync是否安装
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}错误: rsync 未安装，请先安装 rsync${NC}"
    echo "macOS: brew install rsync"
    echo "Ubuntu/Debian: sudo apt-get install rsync"
    echo "CentOS/RHEL: sudo yum install rsync"
    exit 1
fi

# 检查SSH连接
echo -e "${YELLOW}正在检查服务器连接...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器${NC}"
    echo "请检查:"
    echo "1. 服务器地址和端口是否正确"
    echo "2. SSH服务是否运行"
    echo "3. 防火墙设置"
    echo "4. 安全组配置"
    echo ""
    echo "尝试手动连接:"
    echo "ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
    exit 1
fi

echo -e "${GREEN}✓ SSH连接正常${NC}"
echo ""

# 创建排除参数
EXCLUDE_ARGS=""
for item in "${EXCLUDE_ITEMS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude='$item'"
done

# 显示同步信息
echo -e "${BLUE}同步配置:${NC}"
echo "  源目录: $(pwd)"
echo "  目标服务器: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "  目标目录: $SERVER_DIR"
echo ""

# 询问用户确认
read -p "是否继续同步? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}同步已取消${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}开始同步文件...${NC}"

# 执行同步
SYNC_START_TIME=$(date +%s)

# 使用rsync进行同步
rsync -avz --progress \
    --delete \
    --delete-excluded \
    -e "ssh -p $SERVER_PORT" \
    $EXCLUDE_ARGS \
    --include='*.html' \
    --include='styles/' \
    --include='scripts/' \
    --include='components/' \
    --include='images/' \
    --include='*.py' \
    --include='*.txt' \
    --include='*.md' \
    --include='*.sh' \
    --include='*.js' \
    --include='*.css' \
    --include='*.json' \
    --include='*.svg' \
    --include='*.png' \
    --include='*.jpg' \
    --include='*.jpeg' \
    --include='*.gif' \
    --include='*.ico' \
    --include='*.webp' \
    --include='*.tiff' \
    --include='*.bmp' \
    --include='*.exr' \
    --exclude='*' \
    ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/

SYNC_END_TIME=$(date +%s)
SYNC_DURATION=$((SYNC_END_TIME - SYNC_START_TIME))

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ 同步完成!${NC}"
    echo -e "${GREEN}  耗时: ${SYNC_DURATION}秒${NC}"
    echo ""
    
    # 显示同步的文件统计
    echo -e "${BLUE}同步统计:${NC}"
    echo "  同步时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  耗时: ${SYNC_DURATION}秒"
    echo ""
    
    # 检查服务器上的文件
    echo -e "${YELLOW}检查服务器文件...${NC}"
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "ls -la $SERVER_DIR/ | head -10"
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    同步成功完成!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}访问地址:${NC}"
    echo "  http://$SERVER_HOST"
    echo "  http://www.yuntucv.com"
    echo ""
    echo -e "${BLUE}如需重启服务，请执行:${NC}"
    echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
    echo "  cd $SERVER_DIR"
    echo "  ./deploy-simple.sh"
    
else
    echo ""
    echo -e "${RED}✗ 同步失败!${NC}"
    echo "请检查错误信息并重试"
    exit 1
fi
