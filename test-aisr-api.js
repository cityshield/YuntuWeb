// 测试AISR API调用
async function testAISRAPI() {
    console.log('开始测试AISR API...');
    
    try {
        // 1. 测试健康检查
        console.log('1. 测试健康检查...');
        const healthResponse = await fetch('/api/health');
        const healthData = await healthResponse.json();
        console.log('健康检查结果:', healthData);
        
        // 2. 测试使用统计
        console.log('2. 测试使用统计...');
        const statsResponse = await fetch('/api/usage-stats');
        const statsData = await statsResponse.json();
        console.log('使用统计结果:', statsData);
        
        // 3. 测试AISR处理（使用一个小的测试图片）
        console.log('3. 测试AISR处理...');
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1像素的PNG图片
        
        const aisrPayload = {
            image: testImageBase64,
            input_format: 'PNG',
            filename: 'test.png'
        };
        
        const aisrResponse = await fetch('/api/aisr-process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aisrPayload)
        });
        
        console.log('AISR响应状态:', aisrResponse.status);
        const aisrData = await aisrResponse.json();
        console.log('AISR处理结果:', aisrData);
        
        if (aisrData.error) {
            console.error('AISR处理失败:', aisrData.message);
        } else {
            console.log('AISR处理成功!');
            console.log('结果图片大小:', aisrData.size);
            console.log('MIME类型:', aisrData.mimeType);
        }
        
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 在浏览器控制台中运行测试
if (typeof window !== 'undefined') {
    console.log('在浏览器中运行AISR API测试...');
    testAISRAPI();
} else {
    console.log('请在浏览器控制台中运行: testAISRAPI()');
}