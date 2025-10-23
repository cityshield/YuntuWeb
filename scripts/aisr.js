// AISR Page JavaScript
class AISRUploader {
    constructor() {
        this.maxFileSize = 100 * 1024 * 1024; // 100MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp'];
        this.dailyLimit = 20;
        this.usedCount = 0;
        
        this.initElements();
        this.initEventListeners();
        this.loadUsageStats();
        this.checkAPIStatus();
        
        // 初始隐藏下载按钮
        this.hideDownloadButton();
    }

    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.originalImage = document.getElementById('originalImage');
        this.enhancedImage = document.getElementById('enhancedImage');
        this.originalInfo = document.getElementById('originalInfo');
        this.enhancedInfo = document.getElementById('enhancedInfo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.usedCountEl = document.getElementById('usedCount');
        this.progressOverlay = document.getElementById('progressOverlay');
    }

    initEventListeners() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        // Download button
        this.downloadBtn.addEventListener('click', () => {
            this.downloadResult();
        });
    }

    async loadUsageStats() {
        try {
            // 从代理服务器获取使用统计
            const response = await fetch('/api/usage-stats');
            if (response.ok) {
                try {
                    const data = await response.json();
                    this.usedCount = data.usedCount || 0;
                    this.updateUsageDisplay();
                } catch (jsonError) {
                    console.log('使用统计JSON解析失败:', jsonError);
                    this.fallbackToLocalStorage();
                }
            } else {
                console.log('使用统计API请求失败:', response.status);
                this.fallbackToLocalStorage();
            }
        } catch (error) {
            console.log('无法加载使用统计:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        // 降级到本地存储
        const today = new Date().toDateString();
        const stored = localStorage.getItem(`aisr_usage_${today}`);
        this.usedCount = stored ? parseInt(stored) : 0;
        this.updateUsageDisplay();
    }

    saveUsageStats() {
        const today = new Date().toDateString();
        localStorage.setItem(`aisr_usage_${today}`, this.usedCount.toString());
    }

    updateUsageDisplay() {
        this.usedCountEl.textContent = this.usedCount;
        
        // Update limit stats color based on usage
        const limitStats = document.getElementById('limitStats');
        if (this.usedCount >= this.dailyLimit) {
            limitStats.style.color = '#dc2626';
        } else if (this.usedCount >= this.dailyLimit * 0.8) {
            limitStats.style.color = '#f59e0b';
        } else {
            limitStats.style.color = 'var(--text-secondary)';
        }
    }

    // EXR支持已移除

    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`文件大小超过限制 (${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB)`);
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            throw new Error('不支持的文件格式，请使用 JPG、PNG、TIFF、BMP 格式');
        }

        // Check daily limit
        if (this.usedCount >= this.dailyLimit) {
            throw new Error('今日上传次数已达上限 (20次)');
        }
    }

    async handleFile(file) {
        try {
            this.validateFile(file);
            
            // 隐藏下载按钮
            this.hideDownloadButton();
            
            // 立即显示原始图像
            await this.displayOriginalImage(file);
            this.originalInfo.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
            
            // 保存原始文件名用于后续下载
            this.currentOriginalFilename = file.name;
            
            // 显示结果区域
            this.resultsSection.style.display = 'block';
            this.resultsSection.scrollIntoView({ behavior: 'smooth' });
            
            // Show progress - 上传阶段
            this.showProgress();
            this.updateProgress(10, '正在读取文件...');

            // Convert to base64
            const base64 = await this.fileToBase64(file);
            this.updateProgress(30, '正在上传到服务器...');

            // Upload to server
            const result = await this.uploadImage(base64, file.name, file.type);
            
            // 处理阶段 - 更新进度文字
            this.updateProgress(50, '正在交给 AI 处理，请稍候...');

            // Simulate processing time
            await this.delay(1000);
            this.updateProgress(80, 'AI 处理中，请稍候...');
            await this.delay(1000);
            this.updateProgress(100, '处理完成');

            // Display enhanced result
            await this.displayEnhancedResult(result);
            
            // 显示下载按钮
            this.showDownloadButton();
            
            // 显示成功提示
            this.showSuccessMessage();
            
            // Update usage count
            this.usedCount++;
            this.updateUsageDisplay();
            this.saveUsageStats();

            // Hide progress
            setTimeout(() => {
                this.hideProgress();
            }, 1000);

        } catch (error) {
            this.hideProgress();
            this.hideDownloadButton(); // 出错时也隐藏下载按钮
            console.error('上传错误:', error);
            
            // 处理不同类型的错误
            let errorMessage = error.message;
            if (error.message === 'Failed to fetch') {
                errorMessage = '网络连接失败，请检查网络连接或API服务状态';
            } else if (error.name === 'TypeError') {
                errorMessage = '请求失败，可能是跨域问题或API服务不可用';
            } else if (error.message.includes('503')) {
                errorMessage = 'AI服务暂时不可用，请稍后重试';
            } else if (error.message.includes('500')) {
                errorMessage = '服务器内部错误，请联系技术支持';
            } else if (error.message.includes('图像格式不支持') || error.message.includes('图像质量过低')) {
                errorMessage = '图像格式不支持或图像质量过低，请尝试使用其他图片';
            } else if (error.message.includes('timeout')) {
                errorMessage = '请求超时，请稍后重试';
            }
            
            this.showError(errorMessage);
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // 对于 TIFF 格式，直接读取 ArrayBuffer 然后转换为 base64
                if (file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
                    const arrayBuffer = reader.result;
                    const bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64 = btoa(binary);
                    resolve(base64);
                } else {
                    // 其他格式使用原有的方法
                    const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
                    resolve(base64);
                }
            };
            reader.onerror = reject;
            
            // 对于 TIFF 格式，使用 readAsArrayBuffer
            if (file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    async uploadImage(base64, filename, mimeType) {
        // 使用本地代理服务器解决跨域问题
        const PROXY_URL = '';  // 使用相对路径
        
        console.log('开始上传图像到代理服务器:', PROXY_URL);
        
        // 使用代理服务器的 API 格式
        const payload = {
            image: base64,
            input_format: this.getFormatFromMimeType(mimeType, filename)
        };
        
        const response = await fetch(`${PROXY_URL}/api/aisr-process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = '上传失败';
            try {
                const error = await response.json();
                errorMessage = error.detail || error.message || errorMessage;
            } catch (e) {
                if (response.status === 413) {
                    errorMessage = '文件过大，请选择小于100MB的图片文件';
                } else {
                    errorMessage = `服务器错误: ${response.status}`;
                }
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.message || '处理失败');
        }

        // 直接返回代理服务器的响应
        return result;
    }

    getFormatFromMimeType(mimeType, fileName = '') {
        const formatMap = {
            'image/jpeg': 'JPEG',
            'image/jpg': 'JPEG', 
            'image/png': 'PNG',
            'image/tiff': 'TIFF',
            'image/bmp': 'BMP',
            // EXR支持已移除
        };
        
        // EXR支持已移除
        
        return formatMap[mimeType] || 'PNG';
    }

    async displayEnhancedResult(result) {
        // 检查是否为 TIFF 格式，如果是则需要转换用于显示
        if (result.mimeType === 'image/tiff') {
            await this.displayTiffEnhancedResult(result);
        } else {
            // Display enhanced image for other formats
            const enhancedUrl = `data:${result.mimeType};base64,${result.image}`;
            this.enhancedImage.src = enhancedUrl;
            this.enhancedImage.style.display = 'block';
        }
        
        // 显示更详细的信息
        const enhancementInfo = `AI增强结果 (${this.formatFileSize(result.size)})`;
        const sizeInfo = result.outputSize ? ` | 尺寸: ${result.outputSize}` : '';
        const scaleInfo = result.enhancementRatio ? ` | 放大: ${result.enhancementRatio}x` : '';
        this.enhancedInfo.textContent = enhancementInfo + sizeInfo + scaleInfo;

        // Store result for download - 需要原始文件名来生成正确的文件名
        this.currentResult = {
            image: result.image,
            mimeType: result.mimeType,
            filename: this.currentOriginalFilename ? 
                this.generateFilename(this.currentOriginalFilename, result.mimeType) : 
                this.generateFilename('enhanced_image', result.mimeType)
        };
    }

    async displayTiffEnhancedResult(result) {
        try {
            console.log('转换 TIFF 增强结果用于显示...');
            
            // 发送到后端转换服务
            const response = await fetch('/api/convert-tiff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_base64: result.image
                })
            });

            if (response.ok) {
                const convertResult = await response.json();
                if (!convertResult.error) {
                    // 显示转换后的 PNG 图像
                    const pngDataUrl = `data:image/png;base64,${convertResult.image_base64}`;
                    this.enhancedImage.src = pngDataUrl;
                    this.enhancedImage.style.display = 'block';
                    console.log(`TIFF 增强结果转换成功: ${convertResult.width}x${convertResult.height}`);
                } else {
                    throw new Error(convertResult.message);
                }
            } else {
                throw new Error('转换服务请求失败');
            }
        } catch (error) {
            console.error('TIFF 增强结果转换失败:', error);
            // 如果转换失败，显示占位符
            this.showEnhancedImagePlaceholder(result);
        }
    }

    // EXR增强结果显示功能已移除

    showEnhancedImagePlaceholder(result, formatType = 'TIFF') {
        // 显示文件信息占位符
        this.enhancedImage.style.display = 'none';
        
        // 创建占位符元素
        let placeholder = this.enhancedImage.parentElement.querySelector('.enhanced-image-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'enhanced-image-placeholder';
            placeholder.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                background: var(--bg-secondary);
                border: 2px dashed var(--border-color);
                border-radius: var(--radius);
                color: var(--text-secondary);
                text-align: center;
                padding: 20px;
            `;
            this.enhancedImage.parentElement.appendChild(placeholder);
        }
        
        placeholder.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">🎨</div>
            <div style="font-weight: 600; margin-bottom: 5px;">AI增强结果</div>
            <div style="font-size: 0.9rem;">${this.formatFileSize(result.size)}</div>
            <div style="font-size: 0.8rem; margin-top: 10px; color: var(--text-light);">
                ${formatType} 格式增强结果已生成，请下载查看
            </div>
        `;
    }

    async displayOriginalImage(file) {
        try {
            // 确保图片元素可见
            this.originalImage.style.display = 'block';
            
            // 隐藏之前的占位符
            const placeholder = this.originalImage.parentElement.querySelector('.image-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            // 检查是否为 TIFF 格式
            if (file.type === 'image/tiff' || file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
                // 对于 TIFF 格式，使用后端转换服务
                await this.convertTiffForPreview(file);
            } else {
            // 其他格式直接显示
            const originalUrl = URL.createObjectURL(file);
            this.originalImage.src = originalUrl;
            this.originalImage.style.display = 'block';
            }
        } catch (error) {
            console.error('显示原始图像失败:', error);
            this.showImagePlaceholder(file);
        }
    }

    async convertTiffForPreview(file) {
        try {
            console.log('转换 TIFF 格式用于预览...');
            
            // 转换为 base64
            const base64 = await this.fileToBase64(file);
            
            // 发送到后端转换服务
            const response = await fetch('/api/convert-tiff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_base64: base64
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (!result.error) {
                    // 显示转换后的 PNG 图像
                    const pngDataUrl = `data:image/png;base64,${result.image_base64}`;
                    this.originalImage.src = pngDataUrl;
                    this.originalImage.style.display = 'block';
                    console.log(`TIFF 转换成功: ${result.width}x${result.height}`);
                } else {
                    throw new Error(result.message);
                }
            } else {
                throw new Error('转换服务请求失败');
            }
        } catch (error) {
            console.error('TIFF 转换失败:', error);
            this.showImagePlaceholder(file);
        }
    }

    // EXR转换功能已移除

    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    showImagePlaceholder(file) {
        // 显示文件信息占位符
        this.originalImage.style.display = 'none';
        
        // 创建占位符元素
        let placeholder = this.originalImage.parentElement.querySelector('.image-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                background: var(--bg-secondary);
                border: 2px dashed var(--border-color);
                border-radius: var(--radius);
                color: var(--text-secondary);
                text-align: center;
                padding: 20px;
            `;
            this.originalImage.parentElement.appendChild(placeholder);
        }
        
        const formatType = file.type === 'image/tiff' ? 'TIFF' : '未知';
        placeholder.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">📄</div>
            <div style="font-weight: 600; margin-bottom: 5px;">${file.name}</div>
            <div style="font-size: 0.9rem;">${this.formatFileSize(file.size)}</div>
            <div style="font-size: 0.8rem; margin-top: 10px; color: var(--text-light);">
                ${formatType === 'TIFF' ? 'TIFF 格式暂不支持预览' : '图像预览失败'}
            </div>
        `;
    }

    generateFilename(originalName, resultMimeType) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        // 根据结果格式确定文件扩展名
        const extensionMap = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/tiff': 'tiff',
            'image/bmp': 'bmp',
            'image/x-exr': 'exr',
            'application/octet-stream': 'exr'
        };
        const extension = extensionMap[resultMimeType] || 'png';
        
        return `${nameWithoutExt}_sr_${timestamp}.${extension}`;
    }

    downloadResult() {
        if (!this.currentResult) return;

        const link = document.createElement('a');
        link.href = `data:${this.currentResult.mimeType};base64,${this.currentResult.image}`;
        link.download = this.currentResult.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showProgress() {
        // 隐藏上传区域的进度条
        this.uploadProgress.style.display = 'none';
        // 显示结果区域的进度覆盖层
        if (this.progressOverlay) {
            this.progressOverlay.style.display = 'flex';
        }
    }

    hideProgress() {
        // 隐藏上传区域的进度条
        this.uploadProgress.style.display = 'none';
        // 隐藏结果区域的进度覆盖层
        if (this.progressOverlay) {
            this.progressOverlay.style.display = 'none';
        }
        // 重置进度
        this.progressFill.style.width = '0%';
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
    }

    showError(message) {
        // Remove existing error messages
        const existingError = this.uploadArea.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        this.uploadArea.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    hideDownloadButton() {
        if (this.downloadBtn) {
            this.downloadBtn.classList.remove('show');
        }
    }

    showDownloadButton() {
        if (this.downloadBtn) {
            this.downloadBtn.classList.add('show');
        }
    }

    showSuccessMessage() {
        // 创建成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        successDiv.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
            </svg>
            处理成功，请下载查看
        `;
        
        document.body.appendChild(successDiv);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    async checkAPIStatus() {
        try {
            const response = await fetch('/api/health');
            
            if (!response.ok) {
                console.log('API健康检查失败:', response.status);
                this.showAPIWarning('代理服务器连接失败，请检查服务状态');
                return;
            }
            
            // 尝试解析JSON，如果失败则显示警告
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.log('JSON解析失败:', jsonError);
                const contentType = response.headers.get('content-type');
                console.log('Content-Type:', contentType);
                this.showAPIWarning('代理服务器响应格式异常，请重启服务');
                return;
            }
            
            if (data.backend_status === 'unhealthy') {
                this.showAPIWarning('AI服务暂时不可用，请稍后重试');
            }
        } catch (error) {
            console.log('无法检查API状态:', error);
            this.showAPIWarning('无法连接到代理服务器，请检查服务状态');
        }
    }

    showAPIWarning(message) {
        // 在页面上显示API状态警告
        const warningDiv = document.createElement('div');
        warningDiv.className = 'api-warning';
        warningDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
        `;
        warningDiv.textContent = message;
        document.body.appendChild(warningDiv);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (warningDiv.parentNode) {
                warningDiv.parentNode.removeChild(warningDiv);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AISRUploader();
});
