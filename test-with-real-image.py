#!/usr/bin/env python3
"""
使用真实图像测试AISR功能
"""

import requests
import base64
import json
import sys
import os

def create_test_image():
    """创建一个有效的测试图像"""
    # 创建一个简单的PNG图像 (1x1像素的红色点)
    # 这是一个有效的PNG文件
    png_data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )
    return base64.b64encode(png_data).decode('utf-8')

def test_with_real_image():
    """使用真实图像测试"""
    print("=== 使用真实图像测试AISR ===")
    
    # 1. 检查是否有测试图像文件
    test_images = [
        'test-image.jpg',
        'test-image.png', 
        'sample.jpg',
        'sample.png'
    ]
    
    test_image_data = None
    test_format = 'PNG'
    
    for img_file in test_images:
        if os.path.exists(img_file):
            print(f"找到测试图像: {img_file}")
            with open(img_file, 'rb') as f:
                test_image_data = base64.b64encode(f.read()).decode('utf-8')
                test_format = 'PNG' if img_file.endswith('.png') else 'JPEG'
            break
    
    if not test_image_data:
        print("未找到测试图像文件，使用生成的测试图像...")
        test_image_data = create_test_image()
        test_format = 'PNG'
    
    print(f"使用格式: {test_format}")
    print(f"图像数据长度: {len(test_image_data)}")
    
    # 2. 发送到代理服务器
    try:
        payload = {
            'image': test_image_data,
            'input_format': test_format
        }
        
        print("发送请求到代理服务器...")
        response = requests.post(
            'http://www.yuntucv.com:2345/api/aisr-process',
            json=payload,
            timeout=60
        )
        
        print(f"响应状态: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 请求成功!")
            print(f"响应数据: {json.dumps(result, indent=2)}")
            
            if result.get('error'):
                print(f"❌ 处理失败: {result.get('message')}")
                return False
            else:
                print("✅ 图像处理成功!")
                return True
        else:
            print(f"❌ 请求失败: {response.status_code}")
            try:
                error_data = response.json()
                print(f"错误信息: {error_data}")
            except:
                print(f"错误文本: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False

if __name__ == "__main__":
    success = test_with_real_image()
    sys.exit(0 if success else 1)
