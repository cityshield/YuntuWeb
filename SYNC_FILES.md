# 今日修改文件同步清单

## 📋 需要同步的文件列表

### 1. 核心页面文件
- `index.html` - 修复了按钮链接和导航栏遮盖问题
- `aisr.html` - AISR功能页面（新增EXR格式支持）

### 2. 样式文件
- `styles/main.css` - 修复了导航栏z-index和按钮样式
- `styles/aisr.css` - 修复了AISR页面标题遮挡和白色块问题

### 3. 脚本文件
- `scripts/aisr.js` - AISR功能JavaScript（新增EXR格式支持）
- `scripts/components.js` - 组件加载脚本
- `scripts/main.js` - 主页面脚本

### 4. 组件文件
- `components/header.html` - 头部组件
- `components/footer.html` - 底部组件

### 5. 后端服务文件
- `proxy-server.py` - 代理服务器（修复了默认页面路由问题，新增EXR格式支持）
- `requirements.txt` - Python依赖列表（标准版本，新增OpenEXR） ⭐ **新增**
- `requirements-compatible.txt` - Python依赖列表（兼容版本，新增OpenEXR） ⭐ **新增**
- `deploy.sh` - 部署脚本 ⭐ **新增**
- `deploy-simple.sh` - 简化部署脚本 ⭐ **新增**
- `DEPLOYMENT.md` - 部署说明文档 ⭐ **新增**
- `CENTOS_DEPLOYMENT.md` - CentOS专用部署说明 ⭐ **新增**

### 6. 图片资源文件
- `images/logo.svg` - 公司Logo
- `images/banner/a.jpg` - 轮播图1
- `images/banner/b.jpg` - 轮播图2
- `images/banner/c.jpg` - 轮播图3
- `images/icons/*.svg` - 各种图标文件
- `images/office/*.png` - 办公环境图片
- `images/cases/*.svg` - 客户案例图片

## 🔧 服务器端需要执行的操作

### 1. 安装Python依赖
```bash
cd /var/www/yuntucv_web

# 方法1：使用简化部署脚本（推荐）
./deploy-simple.sh

# 方法2：手动安装
# 先尝试标准版本
pip3 install -r requirements.txt
# 如果失败，使用兼容版本
pip3 install -r requirements-compatible.txt
```

### 2. 重启服务
```bash
# 停止现有服务
pkill -f "proxy-server.py"

# 启动新服务
nohup python3 proxy-server.py > proxy-server.log 2>&1 &
```

### 3. 验证部署
```bash
# 检查服务状态
curl http://www.yuntucv.com:2345/api/health

# 检查日志
tail -f proxy-server.log
```

## 📝 今日主要修改内容

1. **导航栏修复**: 解决了导航栏被hero区域遮盖的问题
2. **按钮样式优化**: 统一了"立即试用"按钮的样式，符合shadcn设计规范
3. **AISR页面优化**: 修复了标题遮挡和白色块显示问题
4. **代理服务器优化**: 修复了默认页面路由问题
5. **依赖管理**: 添加了完整的Python依赖管理
6. **EXR格式支持**: 新增对EXR文件格式的完整支持，包括上传、预览、处理和下载

## ⚠️ 注意事项

- 确保服务器Python环境版本兼容
- 检查端口3001是否被占用
- 验证后端API连接状态
- 测试所有功能是否正常工作
- **EXR格式支持需要安装OpenEXR库**，可能需要额外的系统依赖
