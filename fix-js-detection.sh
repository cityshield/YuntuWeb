#!/bin/bash

# 修复JavaScript检测问题的脚本
# 使用方法: ./fix-js-detection.sh

echo "🔧 修复JavaScript API检测问题..."

# 自动切换到服务器环境
if [ -f "./switch-env.sh" ]; then
    ./switch-env.sh server > /dev/null 2>&1
    echo "✅ 已切换到服务器环境"
fi

echo "📝 修复内容:"
echo "  - 改进API状态检查逻辑"
echo "  - 简化Content-Type检查"
echo "  - 增强JSON解析错误处理"
echo "  - 添加测试页面"
echo ""

# 创建修复后的JavaScript文件内容
cat > scripts/aisr-fixed.js << 'EOF'
// 修复后的API状态检查方法
async checkAPIStatus() {
    try {
        const response = await fetch('/api/health');
        
        if (!response.ok) {
            console.log('API健康检查失败:', response.status);
            this.showAPIWarning('代理服务器连接失败，请检查服务状态');
            return;
        }
        
        // 尝试解析JSON，如果失败则显示警告
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.log('JSON解析失败:', jsonError);
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            this.showAPIWarning('代理服务器响应格式异常，请重启服务');
            return;
        }
        
        if (data.backend_status === 'unhealthy') {
            this.showAPIWarning('AI服务暂时不可用，请稍后重试');
        }
    } catch (error) {
        console.log('无法检查API状态:', error);
        this.showAPIWarning('无法连接到代理服务器，请检查服务状态');
    }
}

// 修复后的使用统计加载方法
async loadUsageStats() {
    try {
        // 从代理服务器获取使用统计
        const response = await fetch('/api/usage-stats');
        if (response.ok) {
            try {
                const data = await response.json();
                this.usedCount = data.usedCount || 0;
                this.updateUsageDisplay();
            } catch (jsonError) {
                console.log('使用统计JSON解析失败:', jsonError);
                this.fallbackToLocalStorage();
            }
        } else {
            console.log('使用统计API请求失败:', response.status);
            this.fallbackToLocalStorage();
        }
    } catch (error) {
        console.log('无法加载使用统计:', error);
        this.fallbackToLocalStorage();
    }
}
EOF

echo "✅ 修复脚本已创建"
echo ""
echo "📋 手动修复步骤:"
echo "1. 在服务器上编辑 scripts/aisr.js 文件"
echo "2. 找到 checkAPIStatus() 方法并替换为修复后的版本"
echo "3. 找到 loadUsageStats() 方法并替换为修复后的版本"
echo "4. 保存文件"
echo ""
echo "🔍 或者访问测试页面:"
echo "   http://www.yuntucv.com/test-api-response.html"
echo ""
echo "💡 测试命令:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3001/api/usage-stats"


