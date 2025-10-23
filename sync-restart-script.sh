#!/bin/bash

# 快速同步重启脚本到服务器
# 使用方法: ./sync-restart-script.sh

# 服务器配置
SERVER="root@59.110.51.85"
PORT="777"
DIR="/var/www/yuntucv_web"

echo "🚀 同步重启脚本到服务器..."

# 自动切换到服务器环境
if [ -f "./switch-env.sh" ]; then
    ./switch-env.sh server > /dev/null 2>&1
    echo "✅ 已切换到服务器环境"
fi

# 同步重启脚本
rsync -avz --progress \
    -e "ssh -p $PORT" \
    restart-services-local.sh $SERVER:$DIR/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 重启脚本同步完成!"
    echo ""
    echo "💡 现在您可以在服务器上运行:"
    echo "   cd /var/www/yuntucv_web"
    echo "   chmod +x restart-services-local.sh"
    echo "   ./restart-services-local.sh"
else
    echo ""
    echo "❌ 同步失败，请检查连接"
fi


