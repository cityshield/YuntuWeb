# CentOS 7.9 部署说明

## 系统环境检查

### 1. 检查Python版本
```bash
python3 --version
# 如果版本低于3.6，需要升级Python
```

### 2. 如果Python版本过低，升级Python
```bash
# 安装EPEL仓库
yum install -y epel-release

# 安装Python 3.8
yum install -y python38 python38-pip

# 创建软链接（如果默认python3版本过低）
ln -sf /usr/bin/python3.8 /usr/bin/python3
ln -sf /usr/bin/pip3.8 /usr/bin/pip3
```

## 依赖安装

### 1. 安装系统依赖
```bash
# 安装编译工具和图像处理库
yum groupinstall -y "Development Tools"
yum install -y python38-devel
yum install -y libjpeg-devel zlib-devel freetype-devel lcms2-devel libwebp-devel tcl-devel tk-devel

# 安装 OpenEXR 支持（用于 EXR 格式）
yum install -y OpenEXR-devel ilmbase-devel
```

### 2. 安装Python依赖
```bash
cd /var/www/yuntucv_web

# 升级pip
python3 -m pip install --upgrade pip

# 安装依赖
pip3 install -r requirements.txt
```

## 如果仍然遇到版本问题

### 方案1：使用更兼容的版本
创建 `requirements-compatible.txt`:
```bash
# 创建兼容性更好的依赖文件
cat > requirements-compatible.txt << EOF
Flask==2.0.3
flask-cors==3.0.10
requests==2.25.1
Pillow==8.4.0
EOF

# 安装兼容版本
pip3 install -r requirements-compatible.txt
```

### 方案2：使用虚拟环境
```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 在虚拟环境中安装依赖
pip install -r requirements.txt

# 启动服务时使用虚拟环境
source venv/bin/activate && python proxy-server.py
```

## 服务启动

### 1. 测试启动
```bash
cd /var/www/yuntucv_web
python3 proxy-server.py
```

### 2. 后台运行
```bash
nohup python3 proxy-server.py > proxy-server.log 2>&1 &
```

### 3. 检查服务状态
```bash
# 检查进程
ps aux | grep proxy-server

# 检查端口
netstat -tlnp | grep 3001

# 测试API
curl http://www.yuntucv.com:2345/api/health
```

## 常见问题解决

### 1. PIL/Pillow安装失败
```bash
# 安装系统依赖
yum install -y libjpeg-devel zlib-devel freetype-devel

# 重新安装Pillow
pip3 uninstall Pillow
pip3 install Pillow==8.4.0
```

### 2. OpenEXR安装失败
```bash
# 安装 OpenEXR 系统依赖
yum install -y OpenEXR-devel ilmbase-devel

# 重新安装 OpenEXR
pip3 uninstall OpenEXR
pip3 install OpenEXR==1.3.9
```

### 3. Flask版本冲突
```bash
# 卸载现有Flask
pip3 uninstall Flask

# 安装兼容版本
pip3 install Flask==2.0.3
```

### 4. 权限问题
```bash
# 确保文件权限正确
chown -R root:root /var/www/yuntucv_web
chmod +x /var/www/yuntucv_web/deploy.sh
```

## 系统服务配置

创建systemd服务文件：
```bash
cat > /etc/systemd/system/yuntucv-proxy.service << EOF
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
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
systemctl daemon-reload
systemctl enable yuntucv-proxy
systemctl start yuntucv-proxy
systemctl status yuntucv-proxy
```
