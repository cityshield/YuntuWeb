#!/usr/bin/env python3
"""
简单的 CORS 代理服务器
用于解决前端跨域问题
"""

from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
import requests
import json
import os
import base64
from PIL import Image
import io

# EXR支持已禁用 - 服务器不需要处理EXR文件
EXR_SUPPORT = False
print("ℹ️  EXR支持已禁用 - 服务器配置")

app = Flask(__name__)
CORS(app)  # 允许所有来源的跨域请求

# 设置最大文件大小限制 (100MB)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

# API 配置 - 从环境变量获取，默认为服务器地址
import os
API_BASE_URL = os.environ.get('BACKEND_API_URL', 'http://www.yuntucv.com:2345')
API_TOKEN = 'K8mN2pQ7vR9sT3wX'

@app.errorhandler(413)
def too_large(e):
    """处理文件过大错误"""
    return jsonify({
        'error': True, 
        'message': '文件过大，请选择小于100MB的图片文件',
        'code': 413
    }), 413

@app.route('/')
def index():
    """返回首页"""
    response = make_response(send_from_directory('.', 'index.html'))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    print('[静态文件] 返回首页，已禁用缓存')
    return response

@app.route('/<path:filename>')
def serve_static(filename):
    """提供静态文件服务"""
    response = make_response(send_from_directory('.', filename))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    print(f'[静态文件] 返回文件: {filename}，已禁用缓存')
    return response

@app.route('/api/aisr-process', methods=['POST'])
def proxy_aisr():
    """代理 AISR 请求"""
    try:
        # 获取前端请求数据
        data = request.get_json()
        if not data:
            return jsonify({'error': True, 'message': '无效的请求数据'}), 400
        
        # 转换请求格式，保持输入输出格式一致
        input_format = data.get('input_format', 'PNG')
        payload = {
            'image_base64': data.get('image'),
            'token': API_TOKEN,
            'input_format': input_format,
            'output_format': input_format  # 输出格式与输入格式保持一致
        }
        
        # 转发到后端 API
        response = requests.post(
            f'{API_BASE_URL}/api/v1/super-resolution/swin_real_process',
            json=payload,
            timeout=120
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                # 转换响应格式，根据输入格式设置正确的 MIME 类型
                mime_type_map = {
                    'JPEG': 'image/jpeg',
                    'PNG': 'image/png',
                    'TIFF': 'image/tiff',
                    'BMP': 'image/bmp'
                    # EXR支持已移除
                }
                output_mime_type = mime_type_map.get(input_format, 'image/png')
                
                return jsonify({
                    'error': False,
                    'image': result.get('result_image_base64'),
                    'mimeType': output_mime_type,
                    'size': len(result.get('result_image_base64', '')) * 0.75,
                    'originalSize': len(data.get('image', '')) * 0.75,
                    'enhancementRatio': result.get('scale_factor', 2),
                    'originalSize': result.get('original_size'),
                    'outputSize': result.get('output_size')
                })
            else:
                return jsonify({
                    'error': True,
                    'message': result.get('message', '处理失败')
                }), 400
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            return jsonify({
                'error': True,
                'message': error_data.get('detail', f'API 请求失败: {response.status_code}')
            }), response.status_code
            
    except requests.exceptions.Timeout:
        return jsonify({
            'error': True,
            'message': '请求超时，请稍后重试'
        }), 408
    except requests.exceptions.ConnectionError:
        return jsonify({
            'error': True,
            'message': '无法连接到 AI 服务器，请检查网络连接'
        }), 503
    except Exception as e:
        error_msg = str(e)
        # 处理AI模型相关的错误
        if 'permute' in error_msg or 'tensor' in error_msg or 'dimensions' in error_msg:
            return jsonify({
                'error': True,
                'message': '图像格式不支持或图像质量过低，请尝试使用其他图片'
            }), 400
        else:
            return jsonify({
                'error': True,
                'message': f'处理失败: {error_msg}'
            }), 500

@app.route('/api/convert-tiff', methods=['POST'])
def convert_tiff():
    """将 TIFF 转换为 PNG 用于预览"""
    try:
        data = request.get_json()
        if not data or not data.get('image_base64'):
            return jsonify({'error': True, 'message': '缺少图像数据'}), 400
        
        # 解码 base64
        image_data = base64.b64decode(data['image_base64'])
        
        # 使用 PIL 打开图像
        image = Image.open(io.BytesIO(image_data))
        
        # 转换为 PNG
        output_buffer = io.BytesIO()
        image.save(output_buffer, format='PNG')
        png_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'error': False,
            'image_base64': png_base64,
            'width': image.width,
            'height': image.height,
            'format': image.format
        })
        
    except Exception as e:
        return jsonify({
            'error': True,
            'message': f'转换失败: {str(e)}'
        }), 500

@app.route('/api/convert-exr', methods=['POST'])
def convert_exr():
    """EXR转换功能已禁用"""
    return jsonify({
        'error': True, 
        'message': 'EXR格式支持已禁用 - 服务器配置'
    }), 501

@app.route('/api/usage-stats', methods=['GET'])
def usage_stats():
    """返回使用统计（模拟）"""
    return jsonify({
        'usedCount': 0,
        'dailyLimit': 20,
        'remaining': 20
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        # 检查后端 API 状态
        response = requests.get(f'{API_BASE_URL}/api/v1/health/', timeout=5)
        backend_status = 'healthy' if response.status_code == 200 else 'unhealthy'
    except:
        backend_status = 'unreachable'
    
    return jsonify({
        'status': 'healthy',
        'backend_status': backend_status,
        'message': '代理服务器运行正常'
    })

if __name__ == '__main__':
    # 获取域名配置
    import os
    domain = os.environ.get('DOMAIN', 'localhost')
    proxy_port = os.environ.get('PROXY_PORT', '3001')
    
    print('启动 CORS 代理服务器...')
    print(f'前端地址: http://{domain}:{proxy_port}')
    print(f'API 代理: http://{domain}:{proxy_port}/api/aisr-process')
    print(f'后端 API: {API_BASE_URL}')
    print('-' * 50)
    
    app.run(host='0.0.0.0', port=3001, debug=True)
