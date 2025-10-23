#!/bin/bash

# 同步修改的文件到阿里云服务器
# 使用方法: ./sync-modified-files.sh

set -e

# 服务器配置
SERVER_HOST="59.110.51.85"
SERVER_PORT="777"
SERVER_USER="root"
SERVER_DIR="/var/www/yuntucv_web"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    同步修改的文件到阿里云服务器${NC}"
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

# 需要同步的主要文件列表
FILES_TO_SYNC=(
    # HTML文件
    "index.html"
    "aisr.html"
    "auth.html"
    "cors-proxy.html"
    "test.html"
    "force-refresh.html"
    
    # CSS文件
    "styles/main.css"
    "styles/aisr.css"
    "styles/auth.css"
    
    # JavaScript文件
    "scripts/main.js"
    "scripts/aisr.js"
    "scripts/auth.js"
    "scripts/components.js"
    
    # 组件文件
    "components/header.html"
    "components/footer.html"
    
    # Python文件
    "proxy-server.py"
    
    # 配置文件
    "requirements.txt"
    "requirements-compatible.txt"
    
    # 部署脚本
    "deploy.sh"
    "deploy-simple.sh"
    
    # 文档文件
    "DEPLOYMENT.md"
    "CENTOS_DEPLOYMENT.md"
    "SYNC_FILES.md"
    "AISR-README.md"
    
    # 图标文件
    "images/icons/check.svg"
    "images/icons/gpu-render.svg"
    "images/icons/image-enhance.svg"
    "images/icons/video-frame.svg"
    "images/icons/3d-model.svg"
    "images/icons/3d-animation.svg"
    "images/icons/effects.svg"
    "images/icons/email.svg"
    
    # 同步脚本
    "sync-to-server.sh"
    "quick-sync.sh"
    "sync-modified-files.sh"
)

# 需要同步的目录
DIRS_TO_SYNC=(
    "images/"
    "styles/"
    "scripts/"
    "components/"
)

echo -e "${YELLOW}检查文件存在性...${NC}"

# 检查文件是否存在
MISSING_FILES=()
for file in "${FILES_TO_SYNC[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}警告: 以下文件不存在，将跳过:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
fi

echo -e "${YELLOW}开始同步文件...${NC}"

# 同步单个文件
for file in "${FILES_TO_SYNC[@]}"; do
    if [ -f "$file" ]; then
        echo "📁 同步文件: $file"
        rsync -avz --progress \
            -e "ssh -p $SERVER_PORT" \
            "$file" $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
    fi
done

# 同步目录
for dir in "${DIRS_TO_SYNC[@]}"; do
    if [ -d "$dir" ]; then
        echo "📂 同步目录: $dir"
        rsync -avz --progress \
            -e "ssh -p $SERVER_PORT" \
            "$dir" $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
    fi
done

echo ""
echo -e "${GREEN}✅ 文件同步完成!${NC}"
echo ""
echo -e "${BLUE}访问地址:${NC}"
echo "  http://$SERVER_HOST"
echo "  http://www.yuntucv.com"
echo ""
echo -e "${BLUE}如需重启服务:${NC}"
echo "  ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
echo "  cd $SERVER_DIR && ./deploy-simple.sh"
