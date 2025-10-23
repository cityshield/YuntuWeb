# AISR 图像超分辨率页面

## 功能特性

✅ **拖拽上传** - 支持 JPG、PNG、TIFF、BMP 格式  
✅ **Base64 转换** - 自动处理图像格式转换  
✅ **图像显示** - 上下对比显示原图和处理结果  
✅ **下载功能** - 支持下载处理结果图片  
✅ **IP 限制** - 每 IP 每天 20 次上传限制  
✅ **文件大小限制** - 最大 100MB  
✅ **实时进度** - 显示上传和处理进度  
✅ **错误处理** - 完善的错误提示和异常处理  

## 文件结构

```
aisr.html              # 主页面
styles/aisr.css        # 页面样式
scripts/aisr.js        # 前端逻辑
test-aisr-api.js       # API 测试脚本
AISR-README.md         # 说明文档
```

## API 配置

### 当前配置
- **API 地址**: `http://www.yuntucv.com:2345`
- **API Token**: `K8mN2pQ7vR9sT3wX`
- **接口路径**: `/api/v1/super-resolution/swin_real_process`

### 修改配置
在 `scripts/aisr.js` 中修改以下变量：

```javascript
const API_BASE_URL = 'http://your-api-server:port';
const API_TOKEN = 'your-api-token';
```

## 使用方法

### 1. 启动 API 服务
确保后端 API 服务正在运行：
```bash
# 测试 API 连接
node test-aisr-api.js
```

### 2. 访问页面
打开 `aisr.html` 文件

### 3. 上传图片
- 拖拽图片到上传区域
- 或点击"选择文件"按钮

### 4. 查看结果
- 上方显示原始图像
- 下方显示 AI 增强结果
- 点击"下载结果"保存图片

## API 接口规范

### 请求格式
```json
{
    "image_base64": "base64编码的图像数据",
    "token": "API访问令牌",
    "input_format": "JPEG|PNG|TIFF|BMP",
    "output_format": "PNG"
}
```

### 响应格式
```json
{
    "success": true,
    "result_image_base64": "base64编码的结果图像",
    "original_size": "原始图像尺寸",
    "output_size": "输出图像尺寸", 
    "scale_factor": "放大倍数"
}
```

## 错误处理

### 常见错误
- **文件格式不支持** - 请使用 JPG、PNG、TIFF、BMP 格式
- **文件过大** - 请确保文件小于 100MB
- **上传次数超限** - 每 IP 每天限制 20 次
- **API 连接失败** - 检查网络连接和 API 服务状态

### 调试方法
1. 运行测试脚本：`node test-aisr-api.js`
2. 检查浏览器控制台错误信息
3. 确认 API 服务正常运行

## 技术实现

### 前端技术
- **HTML5** - 拖拽上传支持
- **CSS3** - 响应式设计和动画效果
- **JavaScript ES6+** - 异步处理和错误处理
- **Fetch API** - HTTP 请求处理

### 后端要求
- **RESTful API** - 标准 HTTP 接口
- **Base64 编码** - 图像数据传输
- **JSON 格式** - 请求和响应数据

## 部署说明

### 本地测试
1. 确保 API 服务运行在 `http://192.168.99.49:8000`
2. 打开 `aisr.html` 文件
3. 测试图像上传功能

### 生产部署
1. 修改 API 地址为生产环境
2. 配置正确的 API Token
3. 部署到 Web 服务器
4. 配置 HTTPS（推荐）

## 注意事项

⚠️ **API 依赖** - 页面依赖外部 API 服务  
⚠️ **网络要求** - 需要稳定的网络连接  
⚠️ **浏览器兼容** - 建议使用现代浏览器  
⚠️ **文件大小** - 大文件上传可能需要较长时间  

## 更新日志

- **v1.0.0** - 初始版本，支持基本的图像上传和处理
- **v1.1.0** - 添加拖拽上传和进度显示
- **v1.2.0** - 集成真实 API 接口
- **v1.3.0** - 完善错误处理和用户体验

