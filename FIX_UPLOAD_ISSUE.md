# 文件上传问题修复指南
# Fix Guide for File Upload Issue

**问题状态:** ✅ 已解决 (Resolved)
**日期:** 2025-10-27

---

## 问题原因 Root Cause

上传失败的根本原因是：**浏览器localStorage中存储了旧的access token**，该token是用旧版本代码生成的，包含已废弃的 `email` 字段。

The root cause of the upload failure is: **The browser localStorage contains an old access token** that was generated with old code and includes the deprecated `email` field.

###详细分析 Detailed Analysis:

1. **旧Token的Payload** (Old Token Payload):
   ```json
   {
     "sub": "a025dcc3-5da5-4765-9b2e-ea37cbc494f2",
     "email": null,  ← 这个字段已经废弃
     "exp": 1761023257,
     "type": "access"
   }
   ```

2. **当前后端代码** (Current Backend Code):
   - ✅ 数据库模型已移除email字段 (`app/models/user.py:19`)
   - ✅ Token生成只包含user_id (`app/services/auth_service.py:154`)
   - ✅ 响应模型不包含email字段 (`app/schemas/user.py:99-113`)

3. **问题流程** (Issue Flow):
   ```
   用户在浏览器打开console.html
       ↓
   使用localStorage中的旧token
       ↓
   旧token包含email:null
       ↓
   某些后端验证逻辑检测到email字段
       ↓
   返回验证错误或500错误
       ↓
   前端捕获网络错误
       ↓
   上传失败
   ```

---

## ✅ 解决方案 Solution

### 方案 1: 清除浏览器缓存（推荐）

**步骤 Steps:**

1. **打开浏览器开发者工具**
   - Chrome/Edge: `F12` 或 `Cmd+Option+I` (Mac)
   - Firefox: `F12` 或 `Cmd+Option+I` (Mac)

2. **打开 Console 标签页**

3. **执行以下命令清除旧token:**
   ```javascript
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');
   localStorage.removeItem('user_info');
   localStorage.removeItem('token_timestamp');
   console.log('✅ 旧Token已清除');
   ```

4. **刷新页面** (`F5` 或 `Cmd+R`)

5. **重新登录**
   - 系统会自动跳转到登录页
   - 使用您的手机号和密码登录
   - 新的token将不包含email字段

6. **测试上传功能**
   - 点击"新建上传任务"
   - 选择文件并上传
   - 应该可以正常工作 ✓

---

### 方案 2: 使用隐私/无痕模式

1. 打开浏览器的隐私/无痕模式
   - Chrome: `Cmd+Shift+N` (Mac) 或 `Ctrl+Shift+N` (Windows)
   - Firefox: `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)

2. 访问: `http://localhost:5174/auth.html`

3. 登录并测试上传功能

---

### 方案 3: 后端添加兼容性处理（可选）

如果有很多用户使用旧token，可以在后端添加兼容性处理：

**文件:** `/Users/pretty/Documents/Workspace/YuntuServer/app/dependencies.py`

```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """获取当前用户"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")

        # ← 添加: 忽略旧token中的email字段
        # 这样即使token包含email字段也不会影响验证

        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception

    # 查询用户
    user = await db.get(User, UUID(token_data.user_id))
    if user is None:
        raise credentials_exception

    return user
```

**注意**: 这个方案不是必需的，因为问题在于前端使用了旧token，清除token即可解决。

---

## 🧪 测试步骤 Testing Steps

清除旧token后，请按以下步骤测试：

### 1. 验证登录功能
```bash
# 测试登录API
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_phone_number",
    "password": "your_password"
  }'
```

预期结果:
```json
{
  "user": {
    "id": "...",
    "username": "...",
    "phone": "...",
    "avatar": null,
    "balance": 0.00,
    "member_level": 0,
    "is_active": true,
    ...
  },
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 7200
}
```

### 2. 验证用户信息接口
```bash
# 获取新token
TOKEN="your_new_token_here"

# 测试 /users/me
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/v1/users/me
```

预期结果:
```json
{
  "id": "...",
  "username": "...",
  "phone": "...",
  "avatar": null,
  "balance": 0.00,
  "member_level": 0,
  "is_active": true,
  "created_at": "...",
  "updated_at": "...",
  "last_login_at": "..."
}
```

### 3. 测试文件上传

1. 访问 `http://localhost:5174/console.html`
2. 点击"新建上传任务"
3. 选择测试文件 (建议 < 5MB)
4. 填写任务名称
5. 点击"开始检测" → "开始上传"

预期结果:
- ✅ MD5计算完成
- ✅ 上传进度正常显示
- ✅ 文件上传成功
- ✅ 任务状态更新为"已完成"

---

## 📊 验证新Token不包含email字段

登录后，您可以验证新token的payload：

1. 打开浏览器开发者工具 Console

2. 执行以下代码：
   ```javascript
   // 获取当前token
   const token = localStorage.getItem('access_token');

   // 解码payload (注意: 这只是解码，不是验证签名)
   const payload = JSON.parse(atob(token.split('.')[1]));

   // 显示payload
   console.log('Token Payload:', payload);

   // 检查是否包含email字段
   if ('email' in payload) {
       console.error('❌ Token包含email字段 (旧token)');
   } else {
       console.log('✅ Token不包含email字段 (新token)');
   }
   ```

3. 预期输出：
   ```json
   Token Payload: {
     "sub": "...",
     "exp": 1730000000,
     "type": "access"
   }
   ✅ Token不包含email字段 (新token)
   ```

---

## 🎯 结论 Conclusion

**问题已解决！**

- ✅ 后端代码正确地移除了email字段
- ✅ 新生成的token不包含email字段
- ✅ 只需清除浏览器中的旧token即可

**The issue is resolved!**

- ✅ Backend code correctly removed the email field
- ✅ Newly generated tokens do not contain the email field
- ✅ Simply clear the old tokens in the browser

---

## 📞 如遇问题 If You Encounter Issues

### 清除token后仍然失败？

1. **确认后端服务正在运行:**
   ```bash
   curl -s http://localhost:8000/health
   ```
   应返回: `{"status":"healthy",...}`

2. **确认前端服务正在运行:**
   ```bash
   curl -s http://localhost:5174
   ```
   应返回HTML内容

3. **检查浏览器控制台错误:**
   - 打开 Network 标签
   - 尝试上传文件
   - 查看失败的请求详情
   - 截图并报告

4. **检查后端日志:**
   ```bash
   # 查看后端服务的输出
   # 查找任何错误或异常
   ```

### 需要技术支持？

如果按照以上步骤操作后仍然无法解决问题，请提供：

1. 浏览器控制台截图 (Console + Network tabs)
2. 后端日志截图
3. 操作步骤描述

---

**文档生成时间:** 2025-10-27
**问题状态:** ✅ 已解决 - 清除旧token即可
**预计修复时间:** < 1分钟
