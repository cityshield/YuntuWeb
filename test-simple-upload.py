#!/usr/bin/env python3
"""
简单的AISR上传测试脚本
用于测试代理服务器和后端API的连接
"""

import requests
import base64
import json
import sys
import os

# 加载配置
if os.path.exists('config.sh'):
    os.system('source config.sh')

def test_api_connection():
    """测试API连接"""
    print("=== AISR API 连接测试 ===")
    
    # 1. 测试代理服务器健康检查
    print("1. 测试代理服务器健康检查...")
    try:
        proxy_health_url = os.environ.get('PROXY_HEALTH_URL', 'http://localhost:3001/api/health')
        response = requests.get(proxy_health_url, timeout=5)
        if response.status_code == 200:
            print("✅ 代理服务器健康检查通过")
            print(f"   响应: {response.json()}")
        else:
            print(f"❌ 代理服务器健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 代理服务器连接失败: {e}")
        return False
    
    # 2. 测试后端API连接
    print("\n2. 测试后端API连接...")
    try:
        backend_health_url = os.environ.get('BACKEND_HEALTH_URL', 'http://www.yuntucv.com:2345/api/v1/health/')
        response = requests.get(backend_health_url, timeout=10)
        if response.status_code == 200:
            print("✅ 后端API连接正常")
            print(f"   响应: {response.json()}")
        else:
            print(f"❌ 后端API连接失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 后端API连接失败: {e}")
        return False
    
    # 3. 测试代理服务器到后端的连接
    print("\n3. 测试代理服务器到后端的连接...")
    try:
        # 创建一个简单的测试图像数据
        test_image_data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        payload = {
            'image': test_image_data,
            'input_format': 'PNG'
        }
        
        proxy_url = os.environ.get('PROXY_URL', 'http://localhost:3001')
        response = requests.post(
            f'{proxy_url}/api/aisr-process',
            json=payload,
            timeout=30
        )
        
        print(f"   响应状态: {response.status_code}")
        print(f"   响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 代理服务器到后端连接正常")
            print(f"   响应数据: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ 代理服务器到后端连接失败: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   错误信息: {error_data}")
            except:
                print(f"   错误文本: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 代理服务器到后端连接测试失败: {e}")
        return False
    
    print("\n=== 所有测试通过 ===")
    return True

if __name__ == "__main__":
    success = test_api_connection()
    sys.exit(0 if success else 1)
