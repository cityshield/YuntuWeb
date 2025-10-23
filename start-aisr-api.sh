#!/bin/bash

# AISR API 启动脚本

echo "启动 AISR API 服务..."

# 检查 Python 版本
python3 --version

# 安装依赖
echo "安装 Python 依赖..."
pip3 install -r requirements.txt

# 创建必要的目录
mkdir -p logs
mkdir -p uploads

# 启动 API 服务
echo "启动 Flask API 服务..."
python3 api/aisr-process.py


