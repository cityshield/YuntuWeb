#!/usr/bin/env python3
"""
AISR API 后端处理脚本
处理图像超分辨率请求
"""

import os
import json
import base64
import hashlib
import sqlite3
from datetime import datetime, date
from flask import Flask, request, jsonify
from PIL import Image
import io
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 配置
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
DAILY_LIMIT = 20
ALLOWED_FORMATS = ['JPEG', 'PNG', 'TIFF', 'BMP']

# 数据库初始化
def init_db():
    """初始化SQLite数据库"""
    conn = sqlite3.connect('aisr_usage.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usage_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            date DATE NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_ip_date ON usage_log(ip_address, date)
    ''')
    
    conn.commit()
    conn.close()

def get_client_ip():
    """获取客户端IP地址"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

def check_daily_limit(ip_address):
    """检查每日使用限制"""
    conn = sqlite3.connect('aisr_usage.db')
    cursor = conn.cursor()
    
    today = date.today()
    cursor.execute(
        'SELECT COUNT(*) FROM usage_log WHERE ip_address = ? AND date = ?',
        (ip_address, today)
    )
    
    count = cursor.fetchone()[0]
    conn.close()
    
    return count < DAILY_LIMIT

def log_usage(ip_address, filename, file_size):
    """记录使用日志"""
    conn = sqlite3.connect('aisr_usage.db')
    cursor = conn.cursor()
    
    today = date.today()
    cursor.execute(
        'INSERT INTO usage_log (ip_address, filename, file_size, date) VALUES (?, ?, ?, ?)',
        (ip_address, filename, file_size, today)
    )
    
    conn.commit()
    conn.close()

def validate_image_data(image_data, mime_type):
    """验证图像数据"""
    try:
        # 解码base64
        image_bytes = base64.b64decode(image_data)
        
        # 检查文件大小
        if len(image_bytes) > MAX_FILE_SIZE:
            raise ValueError(f"文件大小超过限制 ({MAX_FILE_SIZE // 1024 // 1024}MB)")
        
        # 验证图像格式
        image = Image.open(io.BytesIO(image_bytes))
        if image.format not in ALLOWED_FORMATS:
            raise ValueError(f"不支持的图像格式: {image.format}")
        
        return image, image_bytes
        
    except Exception as e:
        raise ValueError(f"图像验证失败: {str(e)}")

def process_image_aisr(image):
    """模拟AI图像超分辨率处理"""
    # 这里应该调用实际的AI模型
    # 目前只是简单的图像放大和增强示例
    
    # 获取原始尺寸
    original_width, original_height = image.size
    
    # 模拟AI处理：放大2倍并增强
    new_width = original_width * 2
    new_height = original_height * 2
    
    # 使用高质量重采样
    enhanced_image = image.resize((new_width, new_height), Image.LANCZOS)
    
    # 简单的对比度和锐化增强
    from PIL import ImageEnhance
    
    # 增强对比度
    enhancer = ImageEnhance.Contrast(enhanced_image)
    enhanced_image = enhancer.enhance(1.2)
    
    # 增强锐度
    enhancer = ImageEnhance.Sharpness(enhanced_image)
    enhanced_image = enhancer.enhance(1.1)
    
    return enhanced_image

@app.route('/api/aisr-process', methods=['POST'])
def process_aisr():
    """处理AISR请求"""
    try:
        # 获取客户端IP
        client_ip = get_client_ip()
        logger.info(f"处理来自 {client_ip} 的AISR请求")
        
        # 检查每日限制
        if not check_daily_limit(client_ip):
            return jsonify({
                'error': True,
                'message': f'今日上传次数已达上限 ({DAILY_LIMIT}次)'
            }), 429
        
        # 获取请求数据
        data = request.get_json()
        if not data:
            return jsonify({
                'error': True,
                'message': '无效的请求数据'
            }), 400
        
        image_data = data.get('image')
        filename = data.get('filename', 'unknown')
        mime_type = data.get('mimeType', 'image/png')
        
        if not image_data:
            return jsonify({
                'error': True,
                'message': '缺少图像数据'
            }), 400
        
        # 验证图像
        original_image, image_bytes = validate_image_data(image_data, mime_type)
        
        # 处理图像
        logger.info(f"开始处理图像: {filename}")
        enhanced_image = process_image_aisr(original_image)
        
        # 转换为base64
        output_buffer = io.BytesIO()
        enhanced_image.save(output_buffer, format='PNG', quality=95)
        enhanced_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
        
        # 记录使用日志
        log_usage(client_ip, filename, len(image_bytes))
        
        logger.info(f"图像处理完成: {filename}")
        
        return jsonify({
            'error': False,
            'image': enhanced_base64,
            'mimeType': 'image/png',
            'size': len(output_buffer.getvalue()),
            'originalSize': len(image_bytes),
            'enhancementRatio': len(output_buffer.getvalue()) / len(image_bytes)
        })
        
    except ValueError as e:
        logger.error(f"验证错误: {str(e)}")
        return jsonify({
            'error': True,
            'message': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"处理错误: {str(e)}")
        return jsonify({
            'error': True,
            'message': '服务器内部错误'
        }), 500

@app.route('/api/usage-stats', methods=['GET'])
def get_usage_stats():
    """获取使用统计"""
    try:
        client_ip = get_client_ip()
        
        conn = sqlite3.connect('aisr_usage.db')
        cursor = conn.cursor()
        
        today = date.today()
        cursor.execute(
            'SELECT COUNT(*) FROM usage_log WHERE ip_address = ? AND date = ?',
            (client_ip, today)
        )
        
        used_count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'usedCount': used_count,
            'dailyLimit': DAILY_LIMIT,
            'remaining': max(0, DAILY_LIMIT - used_count)
        })
        
    except Exception as e:
        logger.error(f"统计错误: {str(e)}")
        return jsonify({
            'usedCount': 0,
            'dailyLimit': DAILY_LIMIT,
            'remaining': DAILY_LIMIT
        })

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # 初始化数据库
    init_db()
    
    # 启动Flask应用
    app.run(host='0.0.0.0', port=5000, debug=True)


