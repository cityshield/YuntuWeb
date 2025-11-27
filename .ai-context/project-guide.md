# YuntuWeb 项目开发指南

位置与蓝图
- 位置：`YuntuWeb/.ai-context/project-guide.md`
- 蓝图相对路径：`../..//云渲染平台业务架构设计文档_V2.0.md`
- 本项目主要覆盖：蓝图 第三/四/五/六章

技术与目录快照（依据当前仓库）
- 技术形态：多页 HTML + 原生 JS 组件
- 关键文件：
  - `YuntuWeb/index.html`, `YuntuWeb/console.html`, `YuntuWeb/components/header.html`
  - `YuntuWeb/scripts/api-config.js`, `YuntuWeb/scripts/auth.js`, `YuntuWeb/scripts/components.js`, `YuntuWeb/scripts/console.js`
  - `YuntuWeb/styles/*.css`

编码约定
- 使用模块化 IIFE/ESM（浏览器兼容范围内），禁止使用 `var`，统一 `const/let`
- `api-config.js` 提供统一请求基座，处理 BaseURL、Token、错误提示、401 重登
- 错误信息需面向用户中文可读，5xx 使用通用提示，4xx 展示具体验证错误
- 鉴权：遵循蓝图“Web 控制台 2 小时无操作自动退出”的会话策略
- 请求保护：重要操作二次确认；≥10个文件删除需短信验证码（蓝图 3.4/安全）

页面与功能约束（蓝图映射）
- 上传（蓝图 3.1）：
  - 支持格式白名单；并发上传≤3；断点续传；MD5 去重
  - 显示进度/剩余时间；失败重试；完成后可一键创建渲染任务
- 渲染任务（蓝图 4.x）：
  - 任务列表/筛选；状态机展示；首/尾帧预览
  - 排队插队仅限“未开始/排队中”
- 计费（蓝图 5.x）：
  - 余额/冻结金额展示；预估费用提示；失败回滚冻结
- 通知（蓝图 6.x）：
  - P0 短信、P1 微信/客户端、P2 客户端；前端需提供消息中心入口与未读红点

自检清单（每次改动）
- Token 刷新与过期处理是否完备？401→刷新失败清 Token 并跳登录
- 大操作前是否二次确认/验证码校验？
- 界面是否符合中文错误提示规范？
- 与后端接口是否符合 RESTful 命名与返回格式？
- 关联 `CROSS-PROJECT-CHECKLIST.md` 的前端相关项已通过？

提交规范
- 提交标题示例：`feat(web): 上传并发限制=3 与断点续传支持 (Blueprint-Ref: 3.1)`
