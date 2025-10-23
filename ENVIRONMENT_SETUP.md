# 🌍 环境配置指南

## 📋 概述

本项目支持本地开发环境和服务器生产环境的灵活切换，通过配置文件统一管理域名和端口。

## 🔧 配置文件

### `config.sh` - 主配置文件

```bash
# 本地开发环境配置
LOCAL_DOMAIN="localhost"
LOCAL_PROXY_PORT="3001"
LOCAL_API_PORT="2345"
LOCAL_BACKEND_DOMAIN="192.168.99.49"

# 服务器生产环境配置
SERVER_DOMAIN="www.yuntucv.com"
SERVER_PROXY_PORT="3001"
SERVER_API_PORT="2345"
SERVER_BACKEND_DOMAIN="www.yuntucv.com"

# 当前使用的配置 - 请根据需要切换
# 本地测试环境（取消注释下面这行）
# DOMAIN=$LOCAL_DOMAIN
# PROXY_PORT=$LOCAL_PROXY_PORT
# API_PORT=$LOCAL_API_PORT
# BACKEND_DOMAIN=$LOCAL_BACKEND_DOMAIN

# 服务器生产环境（取消注释下面这行）
DOMAIN=$SERVER_DOMAIN
PROXY_PORT=$SERVER_PROXY_PORT
API_PORT=$SERVER_API_PORT
BACKEND_DOMAIN=$SERVER_BACKEND_DOMAIN
```

## 🚀 使用方法

### 1. 本地开发环境

**步骤1：修改配置文件**
```bash
# 编辑 config.sh
vim config.sh

# 注释掉服务器配置，启用本地配置
# DOMAIN=$SERVER_DOMAIN
# PROXY_PORT=$SERVER_PROXY_PORT
# API_PORT=$SERVER_API_PORT
# BACKEND_DOMAIN=$SERVER_BACKEND_DOMAIN

DOMAIN=$LOCAL_DOMAIN
PROXY_PORT=$LOCAL_PROXY_PORT
API_PORT=$LOCAL_API_PORT
BACKEND_DOMAIN=$LOCAL_BACKEND_DOMAIN
```

**步骤2：启动服务**
```bash
# 启动代理服务器
./start-proxy.sh

# 测试配置
./test-config.sh
```

### 2. 服务器生产环境

**步骤1：修改配置文件**
```bash
# 编辑 config.sh
vim config.sh

# 注释掉本地配置，启用服务器配置
# DOMAIN=$LOCAL_DOMAIN
# PROXY_PORT=$LOCAL_PROXY_PORT
# API_PORT=$LOCAL_API_PORT
# BACKEND_DOMAIN=$LOCAL_BACKEND_DOMAIN

DOMAIN=$SERVER_DOMAIN
PROXY_PORT=$SERVER_PROXY_PORT
API_PORT=$SERVER_API_PORT
BACKEND_DOMAIN=$SERVER_BACKEND_DOMAIN
```

**步骤2：启动服务**
```bash
# 启动代理服务器
./start-proxy.sh

# 测试配置
./test-config.sh
```

## 📊 服务架构

### 本地环境
- **代理服务器**: `http://localhost:3001`
- **后端API**: `http://192.168.99.49:2345`
- **前端**: `http://localhost:3000`

### 服务器环境
- **代理服务器**: `http://www.yuntucv.com:3001`
- **后端API**: `http://www.yuntucv.com:2345`
- **前端**: `http://www.yuntucv.com`

## 🛠️ 可用脚本

| 脚本 | 功能 | 用法 |
|------|------|------|
| `config.sh` | 加载配置 | `source ./config.sh` |
| `start-proxy.sh` | 启动代理服务器 | `./start-proxy.sh` |
| `test-config.sh` | 测试配置 | `./test-config.sh` |
| `switch-env.sh` | 快速切换环境 | `./switch-env.sh [local\|server]` |
| `quick-sync.sh` | 快速同步到服务器 | `./quick-sync.sh` |
| `smart-sync.sh` | 智能同步（自动环境切换+SSH处理） | `./smart-sync.sh` |
| `test-simple-upload.py` | 测试API连接 | `python3 test-simple-upload.py` |

## 📤 同步到服务器

### 自动同步脚本

我们提供了多个同步脚本，都支持自动环境切换：

#### 1. `quick-sync.sh` - 快速同步
```bash
./quick-sync.sh
```
- ✅ 自动切换到服务器环境
- ✅ 快速同步所有文件
- ✅ 显示同步进度

#### 2. `smart-sync.sh` - 智能同步
```bash
./smart-sync.sh
```
- ✅ 自动切换到服务器环境
- ✅ 智能处理SSH连接问题
- ✅ 支持密码认证
- ✅ 详细的错误诊断

#### 3. `sync-to-server.sh` - 完整同步
```bash
./sync-to-server.sh
```
- ✅ 自动切换到服务器环境
- ✅ 完整的文件同步
- ✅ 用户确认提示
- ✅ 详细的同步统计

#### 4. `sync-modified-files.sh` - 增量同步
```bash
./sync-modified-files.sh
```
- ✅ 自动切换到服务器环境
- ✅ 只同步修改的文件
- ✅ 更快的同步速度

### 同步后操作

同步完成后，通常需要重启服务器端服务：

```bash
# 方法1: 使用SSH连接服务器
ssh -p 777 root@59.110.51.85
cd /var/www/yuntucv_web
./restart-server.sh

# 方法2: 直接执行远程命令
ssh -p 777 root@59.110.51.85 'cd /var/www/yuntucv_web && ./restart-server.sh'
```

## 🔍 故障排除

### 1. 配置不生效
```bash
# 重新加载配置
source ./config.sh

# 检查环境变量
echo $DOMAIN
echo $PROXY_URL
```

### 2. 服务启动失败
```bash
# 查看日志
tail -f proxy-server.log

# 检查端口占用
netstat -tlnp | grep 3001
```

### 3. 连接测试失败
```bash
# 测试配置
./test-config.sh

# 手动测试
curl http://localhost:3001/api/health
curl http://www.yuntucv.com:2345/api/v1/health/
```

## 📝 注意事项

1. **端口配置**: 代理服务器始终使用3001端口，只有域名会变化
2. **后端API**: 后端AI服务地址固定为 `www.yuntucv.com:2345`
3. **环境变量**: 所有脚本都会自动加载配置文件中的环境变量
4. **日志文件**: 代理服务器日志保存在 `proxy-server.log`

## 🎯 快速切换

### 切换到本地环境
```bash
sed -i 's/^DOMAIN=/#DOMAIN=/' config.sh
sed -i 's/^PROXY_PORT=/#PROXY_PORT=/' config.sh
sed -i 's/^API_PORT=/#API_PORT=/' config.sh
sed -i 's/^#DOMAIN=\$LOCAL_DOMAIN/DOMAIN=\$LOCAL_DOMAIN/' config.sh
sed -i 's/^#PROXY_PORT=\$LOCAL_PROXY_PORT/PROXY_PORT=\$LOCAL_PROXY_PORT/' config.sh
sed -i 's/^#API_PORT=\$LOCAL_API_PORT/API_PORT=\$LOCAL_API_PORT/' config.sh
```

### 切换到服务器环境
```bash
sed -i 's/^DOMAIN=/#DOMAIN=/' config.sh
sed -i 's/^PROXY_PORT=/#PROXY_PORT=/' config.sh
sed -i 's/^API_PORT=/#API_PORT=/' config.sh
sed -i 's/^#DOMAIN=\$SERVER_DOMAIN/DOMAIN=\$SERVER_DOMAIN/' config.sh
sed -i 's/^#PROXY_PORT=\$SERVER_PROXY_PORT/PROXY_PORT=\$SERVER_PROXY_PORT/' config.sh
sed -i 's/^#API_PORT=\$SERVER_API_PORT/API_PORT=\$SERVER_API_PORT/' config.sh
```
