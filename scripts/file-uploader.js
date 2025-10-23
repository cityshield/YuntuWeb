/**
 * File Uploader Module
 * 文件上传核心逻辑
 */

import SparkMD5 from 'spark-md5';

// 上传配置
const UPLOAD_CONFIG = {
    chunkSize: 5 * 1024 * 1024, // 5MB per chunk
    largeFileThreshold: 5 * 1024 * 1024, // Files >= 5MB use chunked upload
    maxConcurrent: 3, // Maximum concurrent uploads
    retryLimit: 3, // Retry limit for failed uploads
    retryDelay: 1000 // Retry delay in ms
};

/**
 * File Uploader Class
 */
class FileUploader {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.uploadQueue = [];
        this.activeUploads = 0;
        this.uploadProgress = {};
        this.abortControllers = {};
    }

    /**
     * Calculate file MD5
     */
    async calculateMD5(file, onProgress) {
        return new Promise((resolve, reject) => {
            const chunkSize = 2 * 1024 * 1024; // 2MB chunks for reading
            const chunks = Math.ceil(file.size / chunkSize);
            const spark = new SparkMD5.ArrayBuffer();
            const fileReader = new FileReader();
            let currentChunk = 0;

            fileReader.onload = (e) => {
                spark.append(e.target.result);
                currentChunk++;

                if (onProgress) {
                    const progress = Math.round((currentChunk / chunks) * 100);
                    onProgress(progress);
                }

                if (currentChunk < chunks) {
                    loadNext();
                } else {
                    const md5 = spark.end();
                    resolve(md5);
                }
            };

            fileReader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            const loadNext = () => {
                const start = currentChunk * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const blob = file.slice(start, end);
                fileReader.readAsArrayBuffer(blob);
            };

            loadNext();
        });
    }

    /**
     * 批量检查文件（秒传检测）
     * @param {string} taskId - 任务ID
     * @param {Array} files - 文件信息数组 [{file_name, md5, file_size}, ...]
     */
    async checkFilesBatch(taskId, files) {
        try {
            const response = await this.apiClient.post(
                window.API_ENDPOINTS.files.checkBatch(taskId),
                { files }
            );

            return response;
        } catch (error) {
            console.error('批量秒传检测失败:', error);
            return { existing_files: [], new_files_count: files.length, storage_saved: 0 };
        }
    }

    /**
     * Upload small file directly
     */
    async uploadSmallFile(taskId, fileId, file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        // Create abort controller for this upload
        const abortController = new AbortController();
        this.abortControllers[file.name] = abortController;

        try {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    if (onProgress) {
                        onProgress(progress);
                    }
                }
            });

            // Setup abort
            abortController.signal.addEventListener('abort', () => {
                xhr.abort();
            });

            return new Promise((resolve, reject) => {
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch (error) {
                            reject(new Error('响应解析失败'));
                        }
                    } else {
                        reject(new Error(`上传失败: ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('网络错误'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('上传已取消'));
                });

                const token = this.apiClient.getAccessToken();
                xhr.open('POST', window.API_ENDPOINTS.files.upload(taskId, fileId));
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });
        } finally {
            delete this.abortControllers[file.name];
        }
    }

    /**
     * Upload large file with chunking
     */
    async uploadLargeFile(taskId, fileId, file, onProgress) {
        const totalChunks = Math.ceil(file.size / UPLOAD_CONFIG.chunkSize);
        const uploadedChunks = new Set();
        let uploadedSize = 0;

        // Create abort controller
        const abortController = new AbortController();
        this.abortControllers[file.name] = abortController;

        try {
            // Initialize multipart upload
            const initResponse = await this.apiClient.post(
                window.API_ENDPOINTS.files.initMultipart(taskId, fileId),
                {
                    task_file_id: fileId,
                    file_size: file.size,
                    file_name: file.name,
                    mime_type: file.type || 'application/octet-stream'
                }
            );

            const uploadId = initResponse.upload_id;
            const uploadedParts = [];

            // Upload chunks
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                if (abortController.signal.aborted) {
                    throw new Error('上传已取消');
                }

                const start = chunkIndex * UPLOAD_CONFIG.chunkSize;
                const end = Math.min(start + UPLOAD_CONFIG.chunkSize, file.size);
                const chunk = file.slice(start, end);

                // Upload chunk with retry
                const partNumber = chunkIndex + 1;
                let retries = 0;
                let success = false;
                let etag = null;

                while (retries < UPLOAD_CONFIG.retryLimit && !success) {
                    try {
                        const formData = new FormData();
                        formData.append('chunk_index', partNumber.toString());
                        formData.append('chunk', chunk);

                        const uploadResponse = await this.uploadChunk(
                            taskId,
                            fileId,
                            formData,
                            (chunkProgress) => {
                                // Calculate overall progress
                                const chunkSize = end - start;
                                const currentChunkUploaded = (chunkProgress / 100) * chunkSize;
                                const totalUploaded = uploadedSize + currentChunkUploaded;
                                const overallProgress = Math.round((totalUploaded / file.size) * 100);

                                if (onProgress) {
                                    onProgress(overallProgress);
                                }
                            },
                            abortController
                        );

                        etag = uploadResponse.etag;
                        success = true;
                        uploadedChunks.add(chunkIndex);
                        uploadedSize += (end - start);

                    } catch (error) {
                        retries++;
                        console.error(`分片 ${partNumber} 上传失败 (尝试 ${retries}/${UPLOAD_CONFIG.retryLimit}):`, error);

                        if (retries < UPLOAD_CONFIG.retryLimit) {
                            await new Promise(resolve => setTimeout(resolve, UPLOAD_CONFIG.retryDelay));
                        } else {
                            throw new Error(`分片 ${partNumber} 上传失败，已达到最大重试次数`);
                        }
                    }
                }

                uploadedParts.push({
                    part_number: partNumber,
                    etag: etag
                });
            }

            // Complete multipart upload
            const completeResponse = await this.apiClient.post(
                window.API_ENDPOINTS.files.completeMultipart(taskId, fileId),
                {
                    chunk_etags: uploadedParts
                }
            );

            return completeResponse;

        } finally {
            delete this.abortControllers[file.name];
        }
    }

    /**
     * Upload single chunk
     */
    async uploadChunk(taskId, fileId, formData, onProgress, abortController) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100);
                    if (onProgress) {
                        onProgress(progress);
                    }
                }
            });

            abortController.signal.addEventListener('abort', () => {
                xhr.abort();
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject(new Error('响应解析失败'));
                    }
                } else {
                    reject(new Error(`分片上传失败: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('网络错误'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('上传已取消'));
            });

            const token = this.apiClient.getAccessToken();
            xhr.open('POST', window.API_ENDPOINTS.files.uploadChunk(taskId, fileId));
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);
        });
    }

    /**
     * Upload single file
     * @param {string} taskId - 任务ID
     * @param {string} fileId - 文件ID (TaskFile的ID)
     * @param {File} file - 文件对象
     * @param {object} callbacks - 回调函数
     */
    async uploadFile(taskId, fileId, file, callbacks = {}) {
        const {
            onUploadProgress,
            onComplete,
            onError
        } = callbacks;

        try {
            // Upload file (秒传检测已经在之前批量完成)
            let uploadResult;
            if (file.size < UPLOAD_CONFIG.largeFileThreshold) {
                console.log(`小文件直接上传: ${file.name}`);
                uploadResult = await this.uploadSmallFile(taskId, fileId, file, onUploadProgress);
            } else {
                console.log(`大文件分片上传: ${file.name}`);
                uploadResult = await this.uploadLargeFile(taskId, fileId, file, onUploadProgress);
            }

            if (onComplete) onComplete(uploadResult);
            return uploadResult;

        } catch (error) {
            console.error(`文件上传失败: ${file.name}`, error);
            if (onError) onError(error);
            throw error;
        }
    }

    /**
     * Upload multiple files with concurrency control
     * @param {string} taskId - 任务ID
     * @param {Array} files - 文件数组
     * @param {Object} fileIdMap - 文件名到fileId的映射
     * @param {Object} callbacks - 回调函数
     */
    async uploadFiles(taskId, files, fileIdMap, callbacks = {}) {
        const {
            onFileStart,
            onFileProgress,
            onFileComplete,
            onFileError,
            onAllComplete
        } = callbacks;

        const results = [];
        const fileQueue = [...files];
        let completedCount = 0;
        let failedCount = 0;

        const uploadNext = async () => {
            if (fileQueue.length === 0 && this.activeUploads === 0) {
                // All files processed
                if (onAllComplete) {
                    onAllComplete({
                        total: files.length,
                        completed: completedCount,
                        failed: failedCount,
                        results: results
                    });
                }
                return;
            }

            if (fileQueue.length > 0 && this.activeUploads < UPLOAD_CONFIG.maxConcurrent) {
                const file = fileQueue.shift();
                this.activeUploads++;

                if (onFileStart) {
                    onFileStart(file);
                }

                // 获取文件对应的fileId
                const fileId = fileIdMap[file.name];
                if (!fileId) {
                    console.error(`找不到文件 ${file.name} 对应的fileId`);
                    failedCount++;
                    this.activeUploads--;
                    uploadNext();
                    return;
                }

                try {
                    const result = await this.uploadFile(taskId, fileId, file, {
                        onUploadProgress: (progress) => {
                            if (onFileProgress) {
                                onFileProgress(file, {
                                    stage: 'upload',
                                    progress: progress
                                });
                            }
                        }
                    });

                    results.push({
                        file: file,
                        success: true,
                        result: result
                    });
                    completedCount++;

                    if (onFileComplete) {
                        onFileComplete(file, result);
                    }

                } catch (error) {
                    results.push({
                        file: file,
                        success: false,
                        error: error
                    });
                    failedCount++;

                    if (onFileError) {
                        onFileError(file, error);
                    }
                } finally {
                    this.activeUploads--;
                    uploadNext();
                }
            }
        };

        // Start concurrent uploads
        for (let i = 0; i < UPLOAD_CONFIG.maxConcurrent; i++) {
            uploadNext();
        }
    }

    /**
     * Cancel file upload
     */
    cancelUpload(fileName) {
        const controller = this.abortControllers[fileName];
        if (controller) {
            controller.abort();
            delete this.abortControllers[fileName];
        }
    }

    /**
     * Cancel all uploads
     */
    cancelAllUploads() {
        Object.keys(this.abortControllers).forEach(fileName => {
            this.cancelUpload(fileName);
        });
    }
}

// Export
export default FileUploader;
