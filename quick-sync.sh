#!/bin/bash

# 快速同步脚本 - 盛世云图网站
# 使用方法: ./quick-sync.sh
# 功能: 自动切换到服务器环境并同步文件

# 服务器配置
SERVER="root@59.110.51.85"
PORT="777"
DIR="/var/www/yuntucv_web"

echo "🔄 自动切换到服务器环境..."
echo ""

# 1. 自动切换到服务器环境
if [ -f "./switch-env.sh" ]; then
    ./switch-env.sh server
    echo ""
else
    echo "⚠️  警告: switch-env.sh 未找到，手动切换到服务器环境"
    echo "请确保 config.sh 中服务器环境配置已启用"
    echo ""
fi

echo "🚀 开始同步到阿里云服务器..."
echo "服务器: $SERVER:$PORT"
echo "目录: $DIR"
echo "当前环境: 服务器生产环境"
echo ""

# 执行同步
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
    echo "✅ 同步完成!"
    echo "🌐 访问地址: http://59.110.51.85"
    echo "🌐 域名: http://www.yuntucv.com"
    echo ""
    echo "💡 提示: 如需重启服务器端服务，请运行:"
    echo "   ssh -p $PORT $SERVER 'cd $DIR && ./restart-server.sh'"
else
    echo ""
    echo "❌ 同步失败，请检查连接"
fi
