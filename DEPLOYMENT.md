# 部署说明

## 服务器环境要求

- **操作系统**: CentOS 7.9
- **Python版本**: Python 3.6+
- **Web服务器**: Nginx
- **域名**: yuntucv.com, www.yuntucv.com

## 部署步骤

### 1. 安装Python依赖

```bash
# 进入项目目录
cd /var/www/yuntucv_web

# 安装Python依赖
pip3 install -r requirements.txt

# 或者使用虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. 启动代理服务器

```bash
# 直接启动（开发环境）
python3 proxy-server.py

# 或使用gunicorn（生产环境）
gunicorn -w 4 -b 0.0.0.0:3001 proxy-server:app
```

### 3. 配置Nginx

确保Nginx配置正确代理到代理服务器：

```nginx
server {
    listen 80;
    server_name yuntucv.com www.yuntucv.com;
    
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 配置系统服务（可选）

创建systemd服务文件 `/etc/systemd/system/yuntucv-proxy.service`:

```ini
[Unit]
Description=YuntuCV Proxy Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/yuntucv_web
ExecStart=/usr/bin/python3 proxy-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
systemctl daemon-reload
systemctl enable yuntucv-proxy
systemctl start yuntucv-proxy
```

## 文件同步

使用rsync同步文件到服务器：

```bash
rsync -avz --progress -e "ssh -p 777" \
  --exclude='.DS_Store' \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  . root@59.110.51.85:/var/www/yuntucv_web/
```

## 故障排除

### 1. SSH连接问题
- 检查安全组设置，确保端口777开放
- 验证SSH服务状态：`systemctl status sshd`
- 检查防火墙：`firewall-cmd --list-ports`

### 2. Python依赖问题
- 确保Python版本兼容
- 使用虚拟环境避免依赖冲突
- 检查pip版本：`pip3 --version`

### 3. 服务启动问题
- 检查端口占用：`netstat -tlnp | grep 3001`
- 查看日志：`journalctl -u yuntucv-proxy -f`
- 测试API连接：`curl http://www.yuntucv.com:2345/api/health`

## 更新日志

### 2025-10-12
- 修复了导航栏z-index问题
- 修复了AISR页面标题遮挡问题
- 修复了按钮样式和链接问题
- 添加了Python依赖管理
- 优化了代理服务器配置