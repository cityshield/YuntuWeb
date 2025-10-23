/**
 * Console Main Script
 * 控制台主逻辑
 */

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    console.error('Error details:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

console.log('[Console] Script loading started');

import FileUploader from './file-uploader.js';

console.log('[Console] FileUploader imported successfully');

// Global file uploader instance
let fileUploader = null;

// Global State
const ConsoleState = {
    currentUser: null,
    currentSection: 'dashboard',
    tasks: [],
    pagination: {
        current: 1,
        total: 1,
        limit: 20
    },
    filters: {
        status: '',
        search: ''
    },
    // Upload wizard state
    uploadWizard: {
        currentStep: 1,
        selectedFiles: [],
        taskName: '',
        taskDescription: '',
        instantUploadResults: [],
        uploadProgress: {}
    }
};

console.log('[Console] State initialized');

// Initialize Console
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Console] DOMContentLoaded event fired');

    try {
        console.log('[Console] Starting initialization...');

        // Check if required dependencies are loaded
        if (typeof window.apiClient === 'undefined') {
            console.error('[Console] window.apiClient is not defined!');
            alert('系统初始化失败：API客户端未加载。请刷新页面重试。');
            return;
        }

        if (typeof window.API_ENDPOINTS === 'undefined') {
            console.error('[Console] window.API_ENDPOINTS is not defined!');
            alert('系统初始化失败：API配置未加载。请刷新页面重试。');
            return;
        }

        console.log('[Console] Dependencies check passed');

        // Check authentication
        const accessToken = localStorage.getItem('access_token');
        console.log('[Console] Access token check:', accessToken ? 'Found' : 'Not found');

        if (!accessToken) {
            console.log('[Console] No access token, redirecting to login');
            window.location.href = 'auth.html';
            return;
        }

        // Initialize file uploader
        console.log('[Console] Initializing file uploader...');
        fileUploader = new FileUploader(window.apiClient);
        console.log('[Console] File uploader initialized successfully');

        // Load user info
        console.log('[Console] Loading user info...');
        await loadUserInfo();
        console.log('[Console] User info loaded');

        // Initialize UI components
        console.log('[Console] Initializing UI components...');
        initializeSidebar();
        initializeNavigation();
        initializeButtons();
        console.log('[Console] UI components initialized');

        // Load initial data
        console.log('[Console] Loading dashboard data...');
        await loadDashboardData();
        console.log('[Console] Dashboard data loaded');

        console.log('[Console] ✅ Initialization completed successfully');

    } catch (error) {
        console.error('[Console] ❌ Initialization failed:', error);
        console.error('[Console] Error stack:', error.stack);
        alert(`控制台初始化失败：${error.message}\n\n请打开浏览器控制台查看详细错误信息。`);
    }
});

/**
 * Load user information
 */
async function loadUserInfo() {
    try {
        const userInfo = window.apiClient.getUserInfo();

        if (!userInfo) {
            throw new Error('No user info found');
        }

        ConsoleState.currentUser = userInfo;

        // Update sidebar
        const sidebarUserName = document.getElementById('sidebar-user-name');
        const sidebarUserPhone = document.getElementById('sidebar-user-phone');
        const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');

        if (sidebarUserName) {
            sidebarUserName.textContent = userInfo.username || '用户';
        }
        if (sidebarUserPhone) {
            const phone = userInfo.phone || '';
            sidebarUserPhone.textContent = phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '---';
        }

        // Update header
        const headerUserAvatar = document.getElementById('header-user-avatar');
        if (headerUserAvatar && userInfo.username) {
            const firstChar = userInfo.username.charAt(0).toUpperCase();
            headerUserAvatar.innerHTML = `<span>${firstChar}</span>`;
        }

        console.log('User info loaded:', userInfo.username);
    } catch (error) {
        console.error('Failed to load user info:', error);
        showToast('加载用户信息失败', 'error');
    }
}

/**
 * Initialize sidebar toggle
 */
function initializeSidebar() {
    const sidebar = document.getElementById('console-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

/**
 * Initialize navigation
 */
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();

            const section = item.getAttribute('data-section');
            await switchSection(section);
        });
    });
}

/**
 * Switch between sections
 */
async function switchSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(`section-${sectionName}`);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
        const sectionNames = {
            'dashboard': '仪表板',
            'tasks': '上传任务'
        };
        breadcrumbCurrent.textContent = sectionNames[sectionName] || sectionName;
    }

    // Load section data
    ConsoleState.currentSection = sectionName;

    if (sectionName === 'dashboard') {
        await loadDashboardData();
    } else if (sectionName === 'tasks') {
        await loadTasksData();
    }

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('console-sidebar').classList.remove('active');
    }
}

/**
 * Initialize buttons
 */
function initializeButtons() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // New task buttons
    const newTaskBtns = document.querySelectorAll('#btn-new-task, #btn-new-task-2');
    newTaskBtns.forEach(btn => {
        btn.addEventListener('click', openNewTaskModal);
    });

    // Scan drives button
    const scanDrivesBtn = document.getElementById('btn-scan-drives');
    if (scanDrivesBtn) {
        scanDrivesBtn.addEventListener('click', handleScanDrives);
    }

    // Filter button
    const filterBtn = document.getElementById('btn-filter');
    if (filterBtn) {
        filterBtn.addEventListener('click', applyFilters);
    }

    // Pagination buttons
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => loadTasksPage(ConsoleState.pagination.current - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => loadTasksPage(ConsoleState.pagination.current + 1));
    }

    // Modal close
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCancel = document.getElementById('btn-modal-cancel');

    [modalClose, modalOverlay, modalCancel].forEach(el => {
        if (el) {
            el.addEventListener('click', closeNewTaskModal);
        }
    });

    // Modal next button
    const modalNext = document.getElementById('btn-modal-next');
    if (modalNext) {
        modalNext.addEventListener('click', handleModalNext);
    }

    // Task detail modal buttons
    const taskDetailClose = document.getElementById('task-detail-close');
    const taskDetailOverlay = document.getElementById('task-detail-overlay');
    const btnDetailClose = document.getElementById('btn-detail-close');

    [taskDetailClose, taskDetailOverlay, btnDetailClose].forEach(el => {
        if (el) {
            el.addEventListener('click', closeTaskDetailModal);
        }
    });
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        // Load stats
        const tasks = await window.apiClient.get(window.API_ENDPOINTS.uploadTasks.list);

        // Calculate stats
        const stats = {
            total: tasks.total || 0,
            active: 0,
            completed: 0,
            totalFiles: 0
        };

        if (tasks.tasks && Array.isArray(tasks.tasks)) {
            tasks.tasks.forEach(task => {
                if (task.status === 'uploading' || task.status === 'pending') {
                    stats.active++;
                }
                if (task.status === 'completed') {
                    stats.completed++;
                }
                stats.totalFiles += task.total_files || 0;
            });
        }

        // Update stat cards
        document.getElementById('stat-total-tasks').textContent = stats.total;
        document.getElementById('stat-active-tasks').textContent = stats.active;
        document.getElementById('stat-completed-tasks').textContent = stats.completed;
        document.getElementById('stat-total-files').textContent = stats.totalFiles.toLocaleString();

        // Load recent tasks
        await loadRecentTasks(tasks.tasks);

    } catch (error) {
        console.error('Failed to load dashboard data:', error);

        // Show error in stat cards
        ['stat-total-tasks', 'stat-active-tasks', 'stat-completed-tasks', 'stat-total-files'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '--';
        });

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('加载仪表板数据失败', 'error');
        }
    }
}

/**
 * Load recent tasks
 */
async function loadRecentTasks(tasks) {
    const recentTaskList = document.getElementById('recent-task-list');

    if (!recentTaskList) return;

    if (!tasks || tasks.length === 0) {
        recentTaskList.innerHTML = '<div class="empty-state">暂无任务</div>';
        return;
    }

    // Show only latest 5 tasks
    const recentTasks = tasks.slice(0, 5);

    recentTaskList.innerHTML = recentTasks.map(task => createTaskCard(task)).join('');
}

/**
 * Load tasks data
 */
async function loadTasksData() {
    await loadTasksPage(1);
}

/**
 * Load tasks page
 */
async function loadTasksPage(page) {
    try {
        const tasksGrid = document.getElementById('tasks-grid');

        if (!tasksGrid) return;

        // Show loading
        tasksGrid.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div><span>加载中...</span></div>';

        // Build query params
        const params = new URLSearchParams({
            skip: (page - 1) * ConsoleState.pagination.limit,
            limit: ConsoleState.pagination.limit
        });

        if (ConsoleState.filters.status) {
            params.append('status', ConsoleState.filters.status);
        }

        // Fetch tasks
        const response = await window.apiClient.get(`${window.API_ENDPOINTS.uploadTasks.list}?${params}`);

        ConsoleState.tasks = response.tasks || [];
        ConsoleState.pagination.current = page;
        ConsoleState.pagination.total = Math.ceil((response.total || 0) / ConsoleState.pagination.limit);

        // Render tasks
        if (ConsoleState.tasks.length === 0) {
            tasksGrid.innerHTML = '<div class="empty-state">暂无任务</div>';
        } else {
            tasksGrid.innerHTML = ConsoleState.tasks.map(task => createTaskCard(task)).join('');
        }

        // Update pagination
        updatePagination();

    } catch (error) {
        console.error('Failed to load tasks:', error);
        const tasksGrid = document.getElementById('tasks-grid');
        if (tasksGrid) {
            tasksGrid.innerHTML = '<div class="empty-state">加载失败</div>';
        }

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('加载任务失败', 'error');
        }
    }
}

/**
 * Create task card HTML
 */
function createTaskCard(task) {
    const statusClass = `status-${task.status || 'pending'}`;
    const statusText = {
        'pending': '待上传',
        'uploading': '上传中',
        'completed': '已完成',
        'failed': '失败',
        'cancelled': '已取消'
    }[task.status] || task.status;

    const progress = task.progress_percentage || 0;
    const uploadedFiles = task.uploaded_files || 0;
    const totalFiles = task.total_files || 0;

    const createdAt = task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '---';

    return `
        <div class="task-card" onclick="viewTaskDetail('${task.id}')">
            <div class="task-header">
                <div>
                    <div class="task-title">${escapeHtml(task.task_name || '未命名任务')}</div>
                    <div class="task-time">${createdAt}</div>
                </div>
                <span class="task-status ${statusClass}">${statusText}</span>
            </div>
            <div class="task-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>${uploadedFiles} / ${totalFiles} 文件</span>
                    <span>${progress.toFixed(1)}%</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn task-btn-primary" onclick="event.stopPropagation(); viewTaskDetail('${task.id}')">查看详情</button>
                ${task.status !== 'completed' && task.status !== 'cancelled' ?
                    `<button class="task-btn task-btn-secondary" onclick="event.stopPropagation(); cancelTask('${task.id}')">取消</button>` :
                    `<button class="task-btn task-btn-secondary" onclick="event.stopPropagation(); deleteTask('${task.id}')">删除</button>`
                }
            </div>
        </div>
    `;
}

/**
 * Update pagination UI
 */
function updatePagination() {
    const paginationText = document.getElementById('pagination-text');
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');

    if (paginationText) {
        paginationText.textContent = `第 ${ConsoleState.pagination.current} 页，共 ${ConsoleState.pagination.total} 页`;
    }

    if (prevBtn) {
        prevBtn.disabled = ConsoleState.pagination.current <= 1;
    }

    if (nextBtn) {
        nextBtn.disabled = ConsoleState.pagination.current >= ConsoleState.pagination.total;
    }
}

/**
 * Apply filters
 */
async function applyFilters() {
    const statusFilter = document.getElementById('filter-status');
    const searchFilter = document.getElementById('filter-search');

    ConsoleState.filters.status = statusFilter ? statusFilter.value : '';
    ConsoleState.filters.search = searchFilter ? searchFilter.value.trim() : '';

    await loadTasksPage(1);
}

/**
 * View task detail
 */
async function viewTaskDetail(taskId) {
    try {
        // Fetch task details
        const task = await window.apiClient.get(`${window.API_ENDPOINTS.uploadTasks.list}/${taskId}`);

        // Open modal and populate with task data
        openTaskDetailModal(task);

    } catch (error) {
        console.error('Failed to load task detail:', error);

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('加载任务详情失败', 'error');
        }
    }
}

/**
 * Open task detail modal
 */
function openTaskDetailModal(task) {
    const modal = document.getElementById('task-detail-modal');
    const modalBody = document.getElementById('task-detail-body');

    if (!modal || !modalBody) return;

    // Format dates
    const createdAt = task.created_at ? new Date(task.created_at).toLocaleString('zh-CN') : '---';
    const updatedAt = task.updated_at ? new Date(task.updated_at).toLocaleString('zh-CN') : '---';

    // Status info
    const statusClass = `status-${task.status || 'pending'}`;
    const statusText = {
        'pending': '待上传',
        'uploading': '上传中',
        'completed': '已完成',
        'failed': '失败',
        'cancelled': '已取消'
    }[task.status] || task.status;

    // Calculate progress
    const progress = task.progress_percentage || 0;
    const uploadedFiles = task.uploaded_files || 0;
    const totalFiles = task.total_files || 0;

    // Build detail content
    modalBody.innerHTML = `
        <div class="task-detail-content">
            <!-- Task Header -->
            <div class="task-detail-header">
                <div class="task-detail-title">
                    <h3>${escapeHtml(task.task_name || '未命名任务')}</h3>
                    <span class="task-status ${statusClass}">${statusText}</span>
                </div>
                ${task.task_description ? `
                    <p class="task-detail-description">${escapeHtml(task.task_description)}</p>
                ` : ''}
            </div>

            <!-- Progress Circle -->
            <div class="task-detail-progress">
                <div class="progress-circle">
                    <svg viewBox="0 0 120 120">
                        <circle class="progress-circle-bg" cx="60" cy="60" r="50"/>
                        <circle class="progress-circle-fill" cx="60" cy="60" r="50"
                            stroke-dasharray="${Math.PI * 100}"
                            stroke-dashoffset="${Math.PI * 100 * (1 - progress / 100)}"
                            transform="rotate(-90 60 60)"/>
                    </svg>
                    <div class="progress-circle-text">
                        <div class="progress-circle-value">${progress.toFixed(1)}%</div>
                        <div class="progress-circle-label">${uploadedFiles} / ${totalFiles}</div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="task-detail-stats">
                <div class="task-stat-item">
                    <div class="task-stat-label">总文件数</div>
                    <div class="task-stat-value">${totalFiles}</div>
                </div>
                <div class="task-stat-item">
                    <div class="task-stat-label">已上传</div>
                    <div class="task-stat-value">${uploadedFiles}</div>
                </div>
                <div class="task-stat-item">
                    <div class="task-stat-label">待上传</div>
                    <div class="task-stat-value">${totalFiles - uploadedFiles}</div>
                </div>
                <div class="task-stat-item">
                    <div class="task-stat-label">进度</div>
                    <div class="task-stat-value">${progress.toFixed(1)}%</div>
                </div>
            </div>

            <!-- Info Grid -->
            <div class="task-detail-info">
                <div class="task-info-row">
                    <span class="task-info-label">任务ID</span>
                    <span class="task-info-value">${task.id}</span>
                </div>
                <div class="task-info-row">
                    <span class="task-info-label">创建时间</span>
                    <span class="task-info-value">${createdAt}</span>
                </div>
                <div class="task-info-row">
                    <span class="task-info-label">更新时间</span>
                    <span class="task-info-value">${updatedAt}</span>
                </div>
                ${task.completed_at ? `
                <div class="task-info-row">
                    <span class="task-info-label">完成时间</span>
                    <span class="task-info-value">${new Date(task.completed_at).toLocaleString('zh-CN')}</span>
                </div>
                ` : ''}
            </div>

            <!-- Actions -->
            <div class="task-detail-actions">
                ${task.status === 'uploading' || task.status === 'pending' ? `
                    <button class="btn btn-secondary" onclick="cancelTaskFromDetail('${task.id}')">取消任务</button>
                ` : ''}
                ${task.status === 'completed' ? `
                    <button class="btn btn-primary" onclick="downloadTaskFiles('${task.id}')">下载文件</button>
                ` : ''}
                ${task.status === 'completed' || task.status === 'cancelled' || task.status === 'failed' ? `
                    <button class="btn btn-danger" onclick="deleteTaskFromDetail('${task.id}')">删除任务</button>
                ` : ''}
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close task detail modal
 */
function closeTaskDetailModal() {
    const modal = document.getElementById('task-detail-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

/**
 * Cancel task from detail modal
 */
async function cancelTaskFromDetail(taskId) {
    closeTaskDetailModal();
    await cancelTask(taskId);
}

/**
 * Delete task from detail modal
 */
async function deleteTaskFromDetail(taskId) {
    closeTaskDetailModal();
    await deleteTask(taskId);
}

/**
 * Download task files
 */
async function downloadTaskFiles(taskId) {
    try {
        showToast('准备下载文件...', 'info');

        // TODO: Implement file download/archive functionality
        // This would typically involve:
        // 1. Request backend to create a zip archive
        // 2. Get download URL
        // 3. Trigger browser download

        showToast('文件下载功能待实现', 'info');

    } catch (error) {
        console.error('Failed to download files:', error);

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('下载失败', 'error');
        }
    }
}

// Make functions globally accessible
window.cancelTaskFromDetail = cancelTaskFromDetail;
window.deleteTaskFromDetail = deleteTaskFromDetail;
window.downloadTaskFiles = downloadTaskFiles;

/**
 * Cancel task
 */
async function cancelTask(taskId) {
    if (!confirm('确定要取消此任务吗？')) {
        return;
    }

    try {
        await window.apiClient.put(`${window.API_ENDPOINTS.uploadTasks.list}/${taskId}/cancel`);
        showToast('任务已取消', 'success');

        // Reload current page
        if (ConsoleState.currentSection === 'dashboard') {
            await loadDashboardData();
        } else {
            await loadTasksPage(ConsoleState.pagination.current);
        }
    } catch (error) {
        console.error('Failed to cancel task:', error);

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('取消任务失败', 'error');
        }
    }
}

/**
 * Delete task
 */
async function deleteTask(taskId) {
    if (!confirm('确定要删除此任务吗？此操作不可恢复。')) {
        return;
    }

    try {
        await window.apiClient.delete(`${window.API_ENDPOINTS.uploadTasks.list}/${taskId}`);
        showToast('任务已删除', 'success');

        // Reload current page
        if (ConsoleState.currentSection === 'dashboard') {
            await loadDashboardData();
        } else {
            await loadTasksPage(ConsoleState.pagination.current);
        }
    } catch (error) {
        console.error('Failed to delete task:', error);

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('删除任务失败', 'error');
        }
    }
}

/**
 * Open new task modal
 */
function openNewTaskModal() {
    const modal = document.getElementById('new-task-modal');
    if (modal) {
        // Reset wizard state
        ConsoleState.uploadWizard = {
            currentStep: 1,
            selectedFiles: [],
            taskName: '',
            taskDescription: '',
            instantUploadResults: [],
            uploadProgress: {}
        };

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize first step
        initializeStep1();
        updateStepIndicator(1);
        updateModalButtons(1);
    }
}

/**
 * Close new task modal
 */
function closeNewTaskModal() {
    const modal = document.getElementById('new-task-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';

        // Reset wizard state
        ConsoleState.uploadWizard = {
            currentStep: 1,
            selectedFiles: [],
            taskName: '',
            taskDescription: '',
            instantUploadResults: [],
            uploadProgress: {}
        };
    }
}

/**
 * Initialize step 1: File selection
 */
function initializeStep1() {
    const stepContent = document.getElementById('step-content');
    if (!stepContent) return;

    stepContent.innerHTML = `
        <div class="step-1-content">
            <h3>选择要上传的文件</h3>
            <p class="step-description">使用原生文件选择器选择文件或文件夹</p>

            <div class="file-input-area">
                <input type="file" id="file-input" multiple style="display: none;">
                <button class="action-btn action-btn-primary" onclick="document.getElementById('file-input').click()">
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    <span>选择文件</span>
                </button>
            </div>

            <div id="selected-files-list" class="selected-files-list"></div>
        </div>
    `;

    // File input change handler
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileSelection);
}

/**
 * Handle file selection
 */
function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    const filesList = document.getElementById('selected-files-list');

    if (files.length === 0) {
        filesList.innerHTML = '';
        ConsoleState.uploadWizard.selectedFiles = [];
        return;
    }

    // Store files in state
    ConsoleState.uploadWizard.selectedFiles = files;

    filesList.innerHTML = `
        <h4>已选择 ${files.length} 个文件</h4>
        <div class="file-list">
            ${files.map(file => `
                <div class="file-item">
                    <span>${escapeHtml(file.name)}</span>
                    <span>${formatFileSize(file.size)}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Enable next button
    updateModalButtons(1, true);
}

/**
 * Handle modal next button
 */
async function handleModalNext() {
    const currentStep = ConsoleState.uploadWizard.currentStep;

    if (currentStep === 1) {
        // Validate file selection
        if (ConsoleState.uploadWizard.selectedFiles.length === 0) {
            showToast('请先选择文件', 'error');
            return;
        }
        // Move to step 2
        ConsoleState.uploadWizard.currentStep = 2;
        initializeStep2();
        updateStepIndicator(2);
        updateModalButtons(2);
    } else if (currentStep === 2) {
        // Validate task configuration
        const taskName = document.getElementById('task-name-input');
        if (!taskName || !taskName.value.trim()) {
            showToast('请输入任务名称', 'error');
            return;
        }
        // Store task info
        ConsoleState.uploadWizard.taskName = taskName.value.trim();
        ConsoleState.uploadWizard.taskDescription = document.getElementById('task-description-input')?.value || '';

        // Move to step 3
        ConsoleState.uploadWizard.currentStep = 3;
        await initializeStep3();
        updateStepIndicator(3);
        updateModalButtons(3);
    } else if (currentStep === 3) {
        // Start upload process
        ConsoleState.uploadWizard.currentStep = 4;
        await initializeStep4();
        updateStepIndicator(4);
        updateModalButtons(4);
    } else if (currentStep === 4) {
        // Close modal and refresh
        closeNewTaskModal();
        if (ConsoleState.currentSection === 'dashboard') {
            await loadDashboardData();
        } else {
            await loadTasksPage(ConsoleState.pagination.current);
        }
    }
}

/**
 * Update step indicator
 */
function updateStepIndicator(step) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((stepEl, index) => {
        const stepNumber = index + 1;
        if (stepNumber < step) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
        } else if (stepNumber === step) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        } else {
            stepEl.classList.remove('active', 'completed');
        }
    });
}

/**
 * Update modal buttons
 */
function updateModalButtons(step, canProceed = false) {
    const nextBtn = document.getElementById('btn-modal-next');
    const cancelBtn = document.getElementById('btn-modal-cancel');

    if (!nextBtn || !cancelBtn) return;

    if (step === 1) {
        nextBtn.textContent = '下一步';
        nextBtn.disabled = !canProceed;
        cancelBtn.style.display = 'inline-block';
    } else if (step === 2) {
        nextBtn.textContent = '开始检测';
        nextBtn.disabled = false;
        cancelBtn.style.display = 'inline-block';
    } else if (step === 3) {
        nextBtn.textContent = '开始上传';
        nextBtn.disabled = false;
        cancelBtn.style.display = 'inline-block';
    } else if (step === 4) {
        nextBtn.textContent = '完成';
        nextBtn.disabled = true; // Will be enabled when upload completes
        cancelBtn.style.display = 'none';
    }
}

/**
 * Initialize step 2: Task configuration
 */
function initializeStep2() {
    const stepContent = document.getElementById('step-content');
    if (!stepContent) return;

    const defaultName = `上传任务_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`;

    stepContent.innerHTML = `
        <div class="step-2-content">
            <h3>配置任务信息</h3>
            <p class="step-description">为此次上传任务设置名称和描述</p>

            <div class="form-group">
                <label for="task-name-input">任务名称 *</label>
                <input type="text" id="task-name-input" class="form-input" placeholder="请输入任务名称" value="${defaultName}">
            </div>

            <div class="form-group">
                <label for="task-description-input">任务描述（可选）</label>
                <textarea id="task-description-input" class="form-textarea" rows="4" placeholder="请输入任务描述"></textarea>
            </div>

            <div class="task-summary">
                <h4>任务摘要</h4>
                <div class="summary-item">
                    <span>文件数量：</span>
                    <span>${ConsoleState.uploadWizard.selectedFiles.length} 个</span>
                </div>
                <div class="summary-item">
                    <span>总大小：</span>
                    <span>${formatFileSize(ConsoleState.uploadWizard.selectedFiles.reduce((sum, f) => sum + f.size, 0))}</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize step 3: Instant upload check
 */
async function initializeStep3() {
    const stepContent = document.getElementById('step-content');
    if (!stepContent) return;

    stepContent.innerHTML = `
        <div class="step-3-content">
            <h3>秒传检测</h3>
            <p class="step-description">正在检测哪些文件可以秒传...</p>

            <div class="instant-check-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="instant-check-progress-bar" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="instant-check-progress-text">0%</div>
            </div>

            <div id="instant-check-results" class="instant-check-results"></div>
        </div>
    `;

    // Perform instant upload check
    await performInstantUploadCheck();
}

/**
 * Perform instant upload check
 */
async function performInstantUploadCheck() {
    const files = ConsoleState.uploadWizard.selectedFiles;
    const results = [];
    let completed = 0;

    const progressBar = document.getElementById('instant-check-progress-bar');
    const progressText = document.getElementById('instant-check-progress-text');
    const resultsDiv = document.getElementById('instant-check-results');

    try {
        // Calculate MD5 for each file
        for (const file of files) {
            try {
                // Calculate MD5
                const md5 = await fileUploader.calculateMD5(file, (md5Progress) => {
                    // Update progress for current file
                    const overallProgress = Math.round(((completed + md5Progress / 100) / files.length) * 100);
                    if (progressBar) progressBar.style.width = `${overallProgress}%`;
                    if (progressText) progressText.textContent = `${overallProgress}% (${completed + 1}/${files.length})`;
                });

                results.push({
                    fileName: file.name,
                    fileSize: file.size,
                    md5: md5,
                    canInstantUpload: false // Will check with backend later
                });

                completed++;
                const progress = Math.round((completed / files.length) * 100);
                if (progressBar) progressBar.style.width = `${progress}%`;
                if (progressText) progressText.textContent = `${progress}% (${completed}/${files.length})`;

            } catch (error) {
                console.error(`MD5 计算失败: ${file.name}`, error);
                results.push({
                    fileName: file.name,
                    fileSize: file.size,
                    md5: null,
                    canInstantUpload: false,
                    error: error.message
                });
                completed++;
            }
        }

        ConsoleState.uploadWizard.instantUploadResults = results;

        // Display results
        const successCount = results.filter(r => r.md5).length;
        const failedCount = results.length - successCount;

        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <h4>检测完成</h4>
                <div class="check-summary">
                    <div class="summary-item success">
                        <span>MD5 计算成功：</span>
                        <span>${successCount} 个</span>
                    </div>
                    ${failedCount > 0 ? `
                    <div class="summary-item primary">
                        <span>计算失败：</span>
                        <span>${failedCount} 个</span>
                    </div>
                    ` : ''}
                </div>
                <p class="hint">提示：秒传检测将在上传时进行</p>
            `;
        }

    } catch (error) {
        console.error('秒传检测失败:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <h4>检测失败</h4>
                <p class="hint" style="color: #dc2626;">错误：${error.message}</p>
            `;
        }
    }
}

/**
 * Initialize step 4: Upload progress
 */
async function initializeStep4() {
    const stepContent = document.getElementById('step-content');
    if (!stepContent) return;

    stepContent.innerHTML = `
        <div class="step-4-content">
            <h3>上传进度</h3>
            <p class="step-description">正在上传文件到云端...</p>

            <div class="overall-progress">
                <h4>总体进度</h4>
                <div class="progress-bar">
                    <div class="progress-fill" id="overall-progress-bar" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="overall-progress-text">0 / ${ConsoleState.uploadWizard.selectedFiles.length} 文件</div>
            </div>

            <div id="file-upload-list" class="file-upload-list"></div>
        </div>
    `;

    // Start upload process
    await startUploadProcess();
}

/**
 * Start upload process
 */
async function startUploadProcess() {
    try {
        // Get user's drives first
        let drivesResponse = await window.apiClient.get(window.API_ENDPOINTS.drives.list);
        let drive;

        if (!drivesResponse.drives || drivesResponse.drives.length === 0) {
            // Auto-create a default drive
            showToast('创建默认盘符...', 'info');
            try {
                drive = await window.apiClient.post(window.API_ENDPOINTS.drives.create, {
                    name: '我的云盘',
                    icon: '💾',
                    description: '自动创建的默认盘符',
                    is_team_drive: false
                });
                showToast('默认盘符创建成功', 'success');
            } catch (error) {
                console.error('Failed to create default drive:', error);
                showToast(`创建默认盘符失败：${error.message}`, 'error');
                return;
            }
        } else {
            // Use the first drive
            drive = drivesResponse.drives[0];
        }

        // Calculate total size
        const totalSize = ConsoleState.uploadWizard.selectedFiles.reduce((sum, file) => sum + file.size, 0);

        // Build file list
        const filesList = ConsoleState.uploadWizard.selectedFiles.map((file, index) => ({
            index: index,
            local_path: file.webkitRelativePath || file.name,
            target_folder_path: '/',
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream'
        }));

        // Create upload manifest
        const uploadManifest = {
            task_name: ConsoleState.uploadWizard.taskName,
            drive_id: drive.id,
            priority: 5,
            total_files: ConsoleState.uploadWizard.selectedFiles.length,
            total_size: totalSize,
            client_info: {
                platform: navigator.platform || 'Web',
                version: '1.0.0',
                ip: null
            },
            files: filesList
        };

        const taskData = {
            upload_manifest: uploadManifest
        };

        showToast('创建上传任务...', 'info');

        const task = await window.apiClient.post(window.API_ENDPOINTS.uploadTasks.list, taskData);
        const taskId = task.id;

        showToast(`任务创建成功：${task.task_name}`, 'success');

        // 获取任务文件列表（获取fileId）
        const taskFilesResponse = await window.apiClient.getTaskFiles(taskId);
        const taskFiles = taskFilesResponse.files || [];

        // 建立文件名到fileId的映射
        const fileIdMap = {};
        taskFiles.forEach(tf => {
            fileIdMap[tf.file_name] = tf.id;
        });

        console.log(`任务文件列表获取成功，共 ${taskFiles.length} 个文件`);

        // Get UI elements
        const progressBar = document.getElementById('overall-progress-bar');
        const progressText = document.getElementById('overall-progress-text');
        const fileListDiv = document.getElementById('file-upload-list');

        // Prepare file upload tracking
        const totalFiles = ConsoleState.uploadWizard.selectedFiles.length;
        let completedFiles = 0;
        let failedFiles = 0;
        const fileProgress = {};

        // Initialize file list UI
        if (fileListDiv) {
            fileListDiv.innerHTML = ConsoleState.uploadWizard.selectedFiles.map(file => `
                <div class="file-upload-item" id="file-item-${escapeHtml(file.name).replace(/[^a-zA-Z0-9]/g, '_')}">
                    <div class="file-upload-info">
                        <span class="file-upload-name">${escapeHtml(file.name)}</span>
                        <span class="file-upload-size">${formatFileSize(file.size)}</span>
                    </div>
                    <div class="file-upload-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="file-upload-status">等待中...</span>
                    </div>
                </div>
            `).join('');
        }

        // Upload files with concurrency control (传递fileIdMap)
        await fileUploader.uploadFiles(taskId, ConsoleState.uploadWizard.selectedFiles, fileIdMap, {
            onFileStart: (file) => {
                console.log(`开始上传: ${file.name}`);
                const itemId = `file-item-${escapeHtml(file.name).replace(/[^a-zA-Z0-9]/g, '_')}`;
                const statusEl = document.querySelector(`#${itemId} .file-upload-status`);
                if (statusEl) statusEl.textContent = '计算MD5...';
            },

            onFileProgress: (file, progressInfo) => {
                const itemId = `file-item-${escapeHtml(file.name).replace(/[^a-zA-Z0-9]/g, '_')}`;
                const progressFill = document.querySelector(`#${itemId} .progress-fill`);
                const statusEl = document.querySelector(`#${itemId} .file-upload-status`);

                if (progressFill) {
                    progressFill.style.width = `${progressInfo.progress}%`;
                }

                if (statusEl) {
                    if (progressInfo.stage === 'md5') {
                        statusEl.textContent = `计算MD5: ${progressInfo.progress}%`;
                    } else if (progressInfo.stage === 'upload') {
                        statusEl.textContent = `上传中: ${progressInfo.progress}%`;
                    }
                }

                fileProgress[file.name] = progressInfo.progress;
            },

            onFileComplete: (file, result) => {
                completedFiles++;
                console.log(`文件上传完成: ${file.name}`, result);

                const itemId = `file-item-${escapeHtml(file.name).replace(/[^a-zA-Z0-9]/g, '_')}`;
                const statusEl = document.querySelector(`#${itemId} .file-upload-status`);
                const progressFill = document.querySelector(`#${itemId} .progress-fill`);

                if (progressFill) {
                    progressFill.style.width = '100%';
                    progressFill.style.background = 'linear-gradient(90deg, #059669, #10b981)';
                }

                if (statusEl) {
                    if (result.instant_upload) {
                        statusEl.textContent = '秒传完成 ✓';
                        statusEl.style.color = '#059669';
                    } else {
                        statusEl.textContent = '上传完成 ✓';
                        statusEl.style.color = '#059669';
                    }
                }

                // Update overall progress
                const overallProgress = Math.round((completedFiles / totalFiles) * 100);
                if (progressBar) progressBar.style.width = `${overallProgress}%`;
                if (progressText) progressText.textContent = `${completedFiles} / ${totalFiles} 文件`;
            },

            onFileError: (file, error) => {
                failedFiles++;
                console.error(`文件上传失败: ${file.name}`, error);

                const itemId = `file-item-${escapeHtml(file.name).replace(/[^a-zA-Z0-9]/g, '_')}`;
                const statusEl = document.querySelector(`#${itemId} .file-upload-status`);
                const progressFill = document.querySelector(`#${itemId} .progress-fill`);

                if (progressFill) {
                    progressFill.style.background = '#dc2626';
                }

                // Extract error message properly
                let errorMessage = '上传失败';
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error && error.message) {
                    errorMessage = typeof error.message === 'string' ? error.message : '上传失败';
                }

                if (statusEl) {
                    statusEl.textContent = `失败: ${errorMessage}`;
                    statusEl.style.color = '#dc2626';
                }

                // Update overall progress (counting failed as processed)
                const processedFiles = completedFiles + failedFiles;
                const overallProgress = Math.round((processedFiles / totalFiles) * 100);
                if (progressBar) progressBar.style.width = `${overallProgress}%`;
                if (progressText) progressText.textContent = `${processedFiles} / ${totalFiles} 文件 (${failedFiles} 失败)`;
            },

            onAllComplete: (summary) => {
                console.log('所有文件处理完成:', summary);

                if (summary.failed === 0) {
                    showToast(`所有文件上传成功！共 ${summary.completed} 个文件`, 'success');
                } else {
                    showToast(`上传完成，${summary.completed} 成功，${summary.failed} 失败`, 'error');
                }

                // Enable completion button
                const nextBtn = document.getElementById('btn-modal-next');
                if (nextBtn) {
                    nextBtn.disabled = false;
                    nextBtn.textContent = '完成';
                }
            }
        });

    } catch (error) {
        console.error('Failed to create upload task:', error);

        // Extract error message properly
        let errorMessage = '未知错误';
        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && error.message) {
            errorMessage = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
        } else if (error) {
            errorMessage = error.toString();
        }

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast(`创建任务失败：${errorMessage}`, 'error');
        }

        // Enable completion button on error
        const nextBtn = document.getElementById('btn-modal-next');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = '关闭';
        }
    }
}

/**
 * Handle scan drives
 */
async function handleScanDrives() {
    try {
        showToast('扫描盘符功能开发中...', 'info');

        // TODO: Implement drive scanning
        // await window.apiClient.post(window.API_ENDPOINTS.drives.scan);

    } catch (error) {
        console.error('Failed to scan drives:', error);

        if (error.isServerError) {
            showToast('服务不可用，请联系官方', 'error');
        } else {
            showToast('扫描盘符失败', 'error');
        }
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    if (!confirm('确定要退出登录吗？')) {
        return;
    }

    try {
        const refreshToken = window.apiClient.getRefreshToken();

        if (refreshToken) {
            await window.apiClient.post(window.API_ENDPOINTS.auth.logout, {
                refresh_token: refreshToken
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear tokens and redirect
        window.apiClient.clearTokens();
        window.location.href = 'auth.html';
    }
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Utility: Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Show toast notification (reuse from auth.js)
 */
function showToast(message, type = 'info') {
    // Check if showToast exists globally
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }

    // Simple fallback toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 24px;
        background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe'};
        color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#065f46' : '#1e40af'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

console.log('Console script loaded');
