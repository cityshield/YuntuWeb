# 手动修复服务器指南

由于SSH连接问题，请按照以下步骤手动修复服务器：

## 🔧 手动修复步骤

### 1. 登录服务器
使用您常用的SSH客户端或阿里云控制台登录：
```bash
ssh -p 777 root@59.110.51.85
# 或者通过阿里云控制台的远程连接功能
```

### 2. 进入项目目录
```bash
cd /var/www/yuntucv_web
```

### 3. 检查当前状态
```bash
# 检查进程
ps aux | grep proxy-server

# 检查端口
netstat -tlnp | grep 3001

# 检查日志
tail -20 proxy-server.log
```

### 4. 停止现有服务
```bash
pkill -f "proxy-server.py"
pkill -f "python3.*proxy-server"
sleep 3
```

### 5. 安装Python依赖
```bash
# 尝试安装依赖
pip3 install -r requirements.txt

# 如果失败，尝试兼容版本
pip3 install -r requirements-compatible.txt

# 或者手动安装
pip3 install Flask==2.2.5 flask-cors==3.0.10 requests==2.28.2 Pillow==9.5.0
```

### 6. 检查配置文件
```bash
# 确认API配置正确
grep "API_BASE_URL" proxy-server.py
# 应该显示: API_BASE_URL = 'http://www.yuntucv.com:2345'
```

### 7. 启动服务
```bash
# 启动代理服务器
nohup python3 proxy-server.py > proxy-server.log 2>&1 &

# 等待启动
sleep 5
```

### 8. 验证服务
```bash
# 检查进程
ps aux | grep proxy-server

# 检查端口
netstat -tlnp | grep 3001

# 测试API
curl http://www.yuntucv.com:2345/api/health
```

### 9. 检查nginx配置
```bash
# 检查nginx状态
systemctl status nginx

# 重新加载nginx
systemctl reload nginx
```

## 🔍 故障排除

### 如果Python依赖安装失败：
```bash
# 更新pip
pip3 install --upgrade pip

# 使用国内镜像
pip3 install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 如果端口被占用：
```bash
# 查找占用进程
lsof -i :3001

# 杀死占用进程
kill -9 <PID>
```

### 如果服务启动失败：
```bash
# 查看详细错误
python3 proxy-server.py

# 检查日志
tail -f proxy-server.log
```

## 📊 验证修复结果

修复成功后，您应该看到：

1. **进程运行**:
```bash
ps aux | grep proxy-server
# 应该显示python3 proxy-server.py进程
```

2. **端口监听**:
```bash
netstat -tlnp | grep 3001
# 应该显示: tcp 0 0 0.0.0.0:3001 0.0.0.0:* LISTEN
```

3. **API健康检查**:
```bash
curl http://www.yuntucv.com:2345/api/health
# 应该返回JSON响应
```

4. **网站功能正常**:
- 访问 http://www.yuntucv.com/aisr.html
- 上传图片测试AI增强功能

## 🆘 如果仍有问题

如果按照上述步骤仍无法解决问题，请：

1. **检查服务器资源**:
```bash
# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查系统负载
top
```

2. **查看系统日志**:
```bash
# 查看系统日志
journalctl -u nginx -f

# 查看错误日志
tail -f /var/log/nginx/error.log
```

3. **重启相关服务**:
```bash
# 重启nginx
systemctl restart nginx

# 重启SSH服务
systemctl restart sshd
```

## 📞 联系支持

如果问题仍然存在，请提供以下信息：
- 服务器系统版本: `cat /etc/os-release`
- Python版本: `python3 --version`
- 错误日志: `tail -50 proxy-server.log`
- 系统资源状态: `top` 和 `df -h` 的输出
