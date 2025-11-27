# 盛世云图前端项目规则 (YuntuCV Web)

> ⚠️ **重要**: 执行任何任务前必须先阅读本文件！

## 📌 项目关键配置（禁止随意修改）

### 端口配置
- **前端开发服务器**: `http://localhost:5174`
  - 使用 Vite 构建工具
  - 配置文件: `vite.config.js`
  - **禁止随意更改端口号**

- **后端API服务器**: `http://localhost:8000`
  - 使用 FastAPI + Uvicorn
  - 项目路径: `/Users/fengdaniu/Documents/cc/YuntuServer`
  - **禁止随意更改端口号**

### API配置
- **API Base URL**: `http://localhost:8000/api/v1`
- **配置文件**: `scripts/api-config.js`
- **环境检测**: 自动根据 hostname 判断 development/production

### CORS配置
- **后端CORS白名单**:
  - `http://localhost:5173`
  - `http://localhost:5174` ✅ 当前使用
  - `http://localhost:3000`
  - `http://localhost:8080`
  - `https://yuntucv.com`
  - `https://www.yuntucv.com`
- **配置位置**: `YuntuServer/.env` 的 `CORS_ORIGINS`
- **重要**: 添加新端口后必须重启后端服务

## 🗂 项目结构

```
yuntucv_web/
├── index.html              # 首页
├── auth.html               # 登录/注册页
├── scripts/
│   ├── api-config.js       # API配置和客户端
│   ├── auth.js             # 认证逻辑
│   └── main.js             # 主页逻辑
├── styles/
│   └── style.css           # 全局样式
├── package.json
└── vite.config.js          # Vite配置
```

## 🔐 认证系统

### 用户凭证（测试环境）
- **手机号**: `15381272988`
- **密码**: `shengshu1020`
- **数据库**: `/Users/fengdaniu/Documents/cc/YuntuServer/yuntu_test.db`

### Token管理
- **Access Token**: 存储在 `localStorage.access_token`
- **Refresh Token**: 存储在 `localStorage.refresh_token`
- **用户信息**: 存储在 `localStorage.user_info`

## 🚨 错误处理规范

### 错误分类
1. **服务端错误** (5xx、网络错误)
   - 显示方式: Toast通知（顶部）
   - 提示内容: "服务不可用，请联系官方"

2. **业务逻辑错误** (4xx)
   - 显示方式: 表单下方错误提示
   - 提示内容: 显示具体的中文错误信息

### Toast组件
- 函数: `showToast(message, type)`
- 类型: `error`, `warning`, `success`, `info`
- 位置: 页面顶部居中
- 自动消失: 3秒

## 🛠 开发流程规范

### 启动服务器
```bash
# 1. 启动后端 (在 YuntuServer 目录)
cd /Users/fengdaniu/Documents/cc/YuntuServer
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. 启动前端 (在 yuntucv_web 目录)
cd /Users/fengdaniu/Documents/cc/yuntucv_web
npm run dev
```

### 修改代码时必须遵守
1. **修改端口前**:
   - 必须检查 CORS 配置
   - 更新 API 配置文件
   - 更新本 RULES 文件
   - 重启所有服务

2. **修改 API 端点**:
   - 检查 `scripts/api-config.js` 中的 `API_ENDPOINTS`
   - 确保前后端路径一致
   - 测试所有相关功能

3. **修改认证逻辑**:
   - 保持 Token 刷新机制
   - 保持错误处理一致性
   - 测试登录、注册、登出流程

## 📝 代码规范

### JavaScript规范
- 使用 ES6+ 语法
- async/await 处理异步
- 错误必须用 try-catch 捕获
- 禁止使用 `var`，使用 `const` 和 `let`

### API调用规范
- 统一使用 `apiClient` 实例
- 所有请求通过 `api-config.js` 的方法
- 错误处理遵循上述规范

### 命名规范
- 文件名: kebab-case (例: `api-config.js`)
- 函数名: camelCase (例: `handleLogin`)
- 常量: UPPER_SNAKE_CASE (例: `API_BASE`)
- 类名: PascalCase (例: `ApiClient`)

## 🐛 常见问题

### CORS错误
- **症状**: Console显示 "blocked by CORS policy"
- **原因**: 前端端口不在后端CORS白名单中
- **解决**:
  1. 修改 `YuntuServer/.env` 的 `CORS_ORIGINS`
  2. 重启后端服务
  3. 刷新前端页面

### 401 未授权错误
- **症状**: API返回401状态码
- **原因**: Token过期或无效
- **自动处理**: `api-config.js` 会自动尝试刷新Token
- **失败处理**: 清除Token，跳转到登录页

### 网络错误
- **症状**: Console显示 "Failed to fetch" 或 "ERR_FAILED"
- **原因**: 后端服务未启动或网络问题
- **显示**: Toast提示 "服务不可用，请联系官方"

## 📦 依赖管理

### 核心依赖
```json
{
  "vite": "^5.0.0",
  "aos": "^2.3.4",
  "swiper": "^11.0.0"
}
```

### 安装命令
```bash
npm install
```

### 更新依赖
- **谨慎更新**: 特别是 vite 版本
- **测试全面**: 更新后测试所有功能

## 🔄 Git工作流

### 提交前检查
- [ ] 代码是否符合规范
- [ ] 是否测试过所有修改
- [ ] 是否更新了相关文档
- [ ] 是否检查了Console错误

### 提交信息格式
```
<type>: <subject>

<body>

🤖 Generated with Claude Code
```

类型: feat, fix, docs, style, refactor, test, chore

## ⚡ 性能优化

### 图片资源
- 使用 WebP 格式
- 添加懒加载
- 压缩图片大小

### 代码分割
- 路由懒加载
- 组件按需加载

## 🔒 安全规范

### Token安全
- 不要在 Console 打印完整 Token
- 不要将 Token 放入 URL
- 使用 HTTPS（生产环境）

### 敏感信息
- 不要提交 `.env` 文件
- 不要在代码中硬编码密码
- API密钥使用环境变量

---

## 📞 联系方式

- **项目负责人**: Claude Code Assistant
- **后端项目**: `/Users/fengdaniu/Documents/cc/YuntuServer`
- **前端项目**: `/Users/fengdaniu/Documents/cc/yuntucv_web`

---

## 📘 业务蓝图规范（重要！）

> ⚠️ **强制要求**：开发任何功能前，必须先阅读业务蓝图对应章节！

> 📁 **路径说明**：本文档位于 YuntuWeb 项目目录。相对路径基于 Workspace 根目录。详见 `../.workspace-config.md`

### 蓝图文档路径
**文档名称：** `云渲染平台业务架构设计文档_V2.0.md`
**位置：** Workspace 根目录
**相对路径：** `../云渲染平台业务架构设计文档_V2.0.md`（从本项目目录访问）

### 本项目（YuntuWeb）对应的蓝图章节

本项目是 **Web 控制台前端**，主要对应以下章节：

| 章节 | 名称 | 说明 |
|-----|------|------|
| **第二章** | 账号与权限体系 | 登录/注册、Token 管理、主子账号 |
| **第三章** | 文件存储与管理模块 | 文件上传、虚拟盘符、文件管理、共享 |
| **第四章** | 渲染任务模块 | 任务列表、进度监控、下载管理 |
| **第五章** | 费用与计费模块 | 充值、代金券、余额、账单 |
| **第六章** | 通知与消息系统 | 消息中心、通知设置 |

### 开发前必读规则

1. **查找对应章节**
   - 开发文件上传功能 → 阅读第 3.1 节
   - 开发渲染任务列表 → 阅读第 4.3 节
   - 开发余额充值 → 阅读第 5.1 节

2. **核心边界条件**（必须严格遵守）
   - 上传并发限制：最多 3 个文件
   - 单文件最大：20GB
   - 支持格式：`.ma, .mb, .zip, .rar, .blend, .c4d, .max, .fbx`
   - 批量删除≥10个文件需短信验证码
   - Web 控制台 2 小时无操作自动退出

3. **权限检查**
   - 区分主账号/子账号权限
   - 子账号只能查看自己的数据
   - 主账号可查看所有子账号数据

4. **安全要求**
   - 密码 bcrypt 加密
   - JWT 双 Token 机制（Access + Refresh）
   - 敏感操作需二次确认或短信验证码

### 相关文档链接

**全局文档（Workspace 根目录）：**
- **目录结构约定：** `../.workspace-config.md`
- **AI 开发指南：** `../AI-DEVELOPMENT-GUIDE.md`
- **跨项目检查清单：** `../CROSS-PROJECT-CHECKLIST.md`
- **提示词模板库：** `../PROMPT-TEMPLATES.md`

### 开发流程建议

```
1. 需求分析
   ↓
2. 查找蓝图对应章节（必须）
   ↓
3. 确认业务规则和边界条件
   ↓
4. 设计 API 调用方案
   ↓
5. 开始编码
   ↓
6. 自查（使用 CROSS-PROJECT-CHECKLIST.md）
   ↓
7. 测试（功能 + 边界 + 权限）
```

### 如何向 AI 提问（推荐模板）

**方式1：显式引用蓝图**
```
"根据蓝图文档第 3.1 节，帮我实现文件上传功能"
```

**方式2：使用标准模板**
```
参考 Workspace 根目录的 PROMPT-TEMPLATES.md
选择合适的模板并填充
```

**方式3：详细描述 + 蓝图章节**
```
"实现文件上传页面，需要：
1. 支持拖拽上传
2. 显示上传进度
3. 最多 3 个并发
4. 参考蓝图第 3.1.2 节的上传前检查规范"
```

---

**最后更新**: 2025-10-23
**版本**: 1.1.0（添加业务蓝图规范）
