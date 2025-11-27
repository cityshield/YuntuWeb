/**
 * 文件管理器核心逻辑
 * 功能: 虚拟盘符管理、文件/文件夹操作、树形导航、文件预览
 */

// 立即执行函数，避免全局变量冲突
;(function() {
  'use strict'

  // 使用全局变量（由 api-config.js 提供）
  const apiClient = window.apiClient
  const API_ENDPOINTS = window.API_ENDPOINTS

// ==================== 全局状态管理 ====================
const state = {
  currentUser: null,
  currentDrive: null,
  currentFolder: null,
  drives: [],
  folders: [],
  files: [],
  selectedFiles: new Set(),
  viewMode: 'list', // 'list' or 'grid'
  breadcrumbs: [],
  contextMenuTarget: null,
}

// ==================== DOM 元素引用 ====================
const elements = {
  // Sidebar
  drivesList: document.getElementById('drives-list'),
  logoutBtn: document.getElementById('logout-btn'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  sidebar: document.getElementById('file-sidebar'),

  // Header & Toolbar
  breadcrumb: document.getElementById('breadcrumb'),
  searchInput: document.getElementById('search-input'),
  btnNewFolder: document.getElementById('btn-new-folder'),
  btnUploadFile: document.getElementById('btn-upload-file'),
  btnDownload: document.getElementById('btn-download'),
  btnDelete: document.getElementById('btn-delete'),
  btnRename: document.getElementById('btn-rename'),
  btnViewGrid: document.getElementById('btn-view-grid'),
  btnViewList: document.getElementById('btn-view-list'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnCollapseTree: document.getElementById('btn-collapse-tree'),

  // Content
  folderTreePanel: document.getElementById('folder-tree-panel'),
  folderTree: document.getElementById('folder-tree'),
  emptyState: document.getElementById('empty-state'),
  fileList: document.getElementById('file-list'),

  // Context Menu & Modal
  contextMenu: document.getElementById('context-menu'),
  previewModal: document.getElementById('preview-modal'),
  previewTitle: document.getElementById('preview-title'),
  previewBody: document.getElementById('preview-body'),
  previewClose: document.getElementById('preview-close'),
  btnPreviewClose: document.getElementById('btn-preview-close'),
  btnPreviewDownload: document.getElementById('btn-preview-download'),
  previewOverlay: document.getElementById('preview-overlay'),

  // File Upload
  fileUploadInput: document.getElementById('file-upload-input'),
}

// ==================== 初始化 ====================
async function init() {
  try {
    // 检查登录状态
    const token = apiClient.getAccessToken()
    if (!token) {
      window.location.href = 'auth.html'
      return
    }

    // 加载用户信息
    await loadUserInfo()

    // 加载虚拟盘符列表
    await loadDrives()

    // 绑定事件
    bindEvents()

    console.log('File manager initialized successfully')
  } catch (error) {
    console.error('Failed to initialize file manager:', error)
    showToast('初始化失败: ' + error.message, 'error')
  }
}

// ==================== 用户信息 ====================
async function loadUserInfo() {
  try {
    const user = await apiClient.get(API_ENDPOINTS.user.profile)
    state.currentUser = user

    // 用户信息已经由 console.js 处理,这里只保存到状态中
    console.log('User info loaded:', user)
  } catch (error) {
    console.error('Failed to load user info:', error)
    throw error
  }
}

// ==================== 虚拟盘符管理 ====================
async function loadDrives() {
  try {
    const response = await apiClient.get(API_ENDPOINTS.drives.list)
    state.drives = response.drives || []

    renderDrives()
    console.log(`Loaded ${state.drives.length} drives`)
  } catch (error) {
    console.error('Failed to load drives:', error)
    if (elements.drivesList) {
      elements.drivesList.innerHTML = `
        <div class="loading-placeholder">
          <p>加载盘符失败</p>
          <button onclick="location.reload()" class="btn btn-secondary btn-sm">重新加载</button>
        </div>
      `
    }
  }
}

function renderDrives() {
  if (!elements.drivesList) {
    console.error('drives-list element not found')
    return
  }

  if (state.drives.length === 0) {
    elements.drivesList.innerHTML = `
      <div class="loading-placeholder">
        <p>暂无盘符</p>
        <button class="btn btn-primary btn-sm" id="btn-create-drive">创建盘符</button>
      </div>
    `
    return
  }

  elements.drivesList.innerHTML = state.drives.map(drive => `
    <div class="drive-item ${state.currentDrive?.id === drive.id ? 'active' : ''}"
         data-drive-id="${drive.id}"
         data-drive-letter="${drive.drive_letter}">
      <div class="drive-icon">${drive.drive_letter}</div>
      <div class="drive-info">
        <div class="drive-name">${drive.drive_letter}: ${drive.name || '本地磁盘'}</div>
        <div class="drive-usage">${formatFileSize(drive.used_size || 0)} / ${formatFileSize(drive.total_size || 0)}</div>
        <div class="drive-progress">
          <div class="drive-progress-bar" style="width: ${calculateUsagePercent(drive.used_size, drive.total_size)}%"></div>
        </div>
      </div>
    </div>
  `).join('')

  // 绑定盘符点击事件
  document.querySelectorAll('.drive-item').forEach(item => {
    item.addEventListener('click', () => {
      const driveId = item.dataset.driveId
      const drive = state.drives.find(d => d.id === driveId)
      if (drive) {
        selectDrive(drive)
      }
    })
  })
}

function calculateUsagePercent(used, total) {
  if (!total || total === 0) return 0
  return Math.min(Math.round((used / total) * 100), 100)
}

async function selectDrive(drive) {
  state.currentDrive = drive
  state.currentFolder = null
  state.breadcrumbs = [{ name: `${drive.drive_letter}:`, path: '/', driveId: drive.id }]

  // 更新UI
  renderDrives()
  renderBreadcrumb()

  // 加载根目录文件
  await loadFiles(drive.id, '/')

  // 加载文件夹树
  await loadFolderTree(drive.id)
}

// ==================== 面包屑导航 ====================
function renderBreadcrumb() {
  if (!elements.breadcrumb) {
    return
  }

  if (state.breadcrumbs.length === 0) {
    elements.breadcrumb.innerHTML = '<span class="breadcrumb-item">文件管理</span>'
    return
  }

  const html = state.breadcrumbs.map((crumb, index) => {
    const isLast = index === state.breadcrumbs.length - 1
    return `
      <span class="breadcrumb-item ${isLast ? '' : ''}" data-index="${index}">
        ${crumb.name}
      </span>
      ${!isLast ? '<span class="breadcrumb-separator">/</span>' : ''}
    `
  }).join('')

  elements.breadcrumb.innerHTML = html

  // 绑定面包屑点击事件
  document.querySelectorAll('.breadcrumb-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index)
      if (!isNaN(index) && index < state.breadcrumbs.length - 1) {
        const crumb = state.breadcrumbs[index]
        navigateToPath(crumb.driveId, crumb.path)
      }
    })
  })
}

async function navigateToPath(driveId, path) {
  const drive = state.drives.find(d => d.id === driveId)
  if (!drive) return

  state.currentDrive = drive
  state.currentFolder = path === '/' ? null : path

  // 更新面包屑
  const pathParts = path.split('/').filter(p => p)
  state.breadcrumbs = [{ name: `${drive.drive_letter}:`, path: '/', driveId }]

  let currentPath = ''
  pathParts.forEach(part => {
    currentPath += `/${part}`
    state.breadcrumbs.push({ name: part, path: currentPath, driveId })
  })

  renderBreadcrumb()
  await loadFiles(driveId, path)
}

// ==================== 文件夹树形导航 ====================
async function loadFolderTree(driveId) {
  if (!elements.folderTree) {
    return
  }

  try {
    // TODO: 实现真实的文件夹树加载逻辑
    // 这里先用模拟数据
    const mockFolders = [
      { id: '1', name: 'Documents', path: '/Documents', children: [] },
      { id: '2', name: 'Images', path: '/Images', children: [] },
      { id: '3', name: 'Videos', path: '/Videos', children: [] },
    ]

    elements.folderTree.innerHTML = renderFolderTreeItems(mockFolders, driveId)

    // 绑定文件夹点击事件
    bindFolderTreeEvents()
  } catch (error) {
    console.error('Failed to load folder tree:', error)
  }
}

function renderFolderTreeItems(folders, driveId, level = 0) {
  if (!folders || folders.length === 0) {
    return '<div class="loading-placeholder"><span>暂无文件夹</span></div>'
  }

  return folders.map(folder => `
    <div class="tree-item" data-folder-path="${folder.path}" data-drive-id="${driveId}" style="padding-left: ${16 + level * 20}px">
      ${folder.children && folder.children.length > 0 ? '<span class="tree-expand">▶</span>' : '<span style="width: 20px;"></span>'}
      <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
      <span>${folder.name}</span>
    </div>
    ${folder.children && folder.children.length > 0 ? `<div class="tree-children" style="display: none;">${renderFolderTreeItems(folder.children, driveId, level + 1)}</div>` : ''}
  `).join('')
}

function bindFolderTreeEvents() {
  document.querySelectorAll('.tree-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      const path = item.dataset.folderPath
      const driveId = item.dataset.driveId

      // 展开/折叠子文件夹
      const expand = item.querySelector('.tree-expand')
      if (expand) {
        expand.classList.toggle('expanded')
        const children = item.nextElementSibling
        if (children && children.classList.contains('tree-children')) {
          children.style.display = children.style.display === 'none' ? 'block' : 'none'
        }
      }

      // 导航到该文件夹
      navigateToPath(driveId, path)

      // 更新选中状态
      document.querySelectorAll('.tree-item').forEach(t => t.classList.remove('active'))
      item.classList.add('active')
    })
  })
}

// ==================== 文件列表 ====================
async function loadFiles(driveId, folderPath = '/') {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.files.list}?drive_id=${driveId}&folder_path=${encodeURIComponent(folderPath)}`
    )

    state.files = response.files || []
    state.selectedFiles.clear()

    renderFileList()
    updateToolbarButtons()

    console.log(`Loaded ${state.files.length} files from ${folderPath}`)
  } catch (error) {
    console.error('Failed to load files:', error)
    showEmptyState()
  }
}

function renderFileList() {
  if (!elements.fileList || !elements.emptyState) {
    return
  }

  if (state.files.length === 0) {
    showEmptyState()
    return
  }

  elements.emptyState.style.display = 'none'
  elements.fileList.style.display = 'block'

  const viewClass = state.viewMode === 'grid' ? 'view-grid' : 'view-list'
  elements.fileList.className = `file-list ${viewClass}`

  if (state.viewMode === 'list') {
    renderListView()
  } else {
    renderGridView()
  }
}

function renderListView() {
  elements.fileList.innerHTML = state.files.map(file => `
    <div class="file-item-list ${state.selectedFiles.has(file.id) ? 'selected' : ''}"
         data-file-id="${file.id}"
         data-file-type="${file.is_folder ? 'folder' : getFileType(file.file_name)}">
      <div class="file-item-icon ${file.is_folder ? 'folder' : getFileType(file.file_name)}">
        ${getFileIcon(file)}
      </div>
      <div class="file-item-info">
        <div class="file-item-name">${file.file_name}</div>
        <div class="file-item-size">${file.is_folder ? '-' : formatFileSize(file.file_size)}</div>
        <div class="file-item-date">${formatDate(file.updated_at || file.created_at)}</div>
      </div>
    </div>
  `).join('')

  bindFileItemEvents()
}

function renderGridView() {
  elements.fileList.innerHTML = state.files.map(file => `
    <div class="file-item-grid ${state.selectedFiles.has(file.id) ? 'selected' : ''}"
         data-file-id="${file.id}"
         data-file-type="${file.is_folder ? 'folder' : getFileType(file.file_name)}">
      <div class="file-item-icon ${file.is_folder ? 'folder' : getFileType(file.file_name)}">
        ${getFileIcon(file)}
      </div>
      <div class="file-item-name">${file.file_name}</div>
      <div class="file-item-size">${file.is_folder ? '-' : formatFileSize(file.file_size)}</div>
    </div>
  `).join('')

  bindFileItemEvents()
}

function bindFileItemEvents() {
  document.querySelectorAll('.file-item-list, .file-item-grid').forEach(item => {
    // 单击选中
    item.addEventListener('click', (e) => {
      const fileId = item.dataset.fileId

      if (e.ctrlKey || e.metaKey) {
        // 多选
        if (state.selectedFiles.has(fileId)) {
          state.selectedFiles.delete(fileId)
          item.classList.remove('selected')
        } else {
          state.selectedFiles.add(fileId)
          item.classList.add('selected')
        }
      } else {
        // 单选
        state.selectedFiles.clear()
        document.querySelectorAll('.file-item-list, .file-item-grid').forEach(i => i.classList.remove('selected'))
        state.selectedFiles.add(fileId)
        item.classList.add('selected')
      }

      updateToolbarButtons()
    })

    // 双击打开
    item.addEventListener('dblclick', () => {
      const fileId = item.dataset.fileId
      const file = state.files.find(f => f.id === fileId)
      if (file) {
        if (file.is_folder) {
          openFolder(file)
        } else {
          previewFile(file)
        }
      }
    })

    // 右键菜单
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      const fileId = item.dataset.fileId
      const file = state.files.find(f => f.id === fileId)
      if (file) {
        showContextMenu(e, file)
      }
    })
  })
}

function showEmptyState() {
  if (elements.emptyState) elements.emptyState.style.display = 'flex'
  if (elements.fileList) elements.fileList.style.display = 'none'
}

function getFileIcon(file) {
  if (file.is_folder) {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
      </svg>
    `
  }

  const type = getFileType(file.file_name)
  const icons = {
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>',
    document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  }

  return icons[type] || icons.document
}

function getFileType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase()

  const typeMap = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    document: ['txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  }

  for (const [type, extensions] of Object.entries(typeMap)) {
    if (extensions.includes(ext)) return type
  }

  return 'document'
}

// ==================== 文件操作 ====================
async function openFolder(folder) {
  if (!state.currentDrive) return

  const newPath = folder.folder_path + '/' + folder.file_name
  state.breadcrumbs.push({
    name: folder.file_name,
    path: newPath,
    driveId: state.currentDrive.id
  })

  renderBreadcrumb()
  await loadFiles(state.currentDrive.id, newPath)
}

async function createNewFolder() {
  if (!state.currentDrive) {
    showToast('请先选择一个盘符', 'warning')
    return
  }

  const folderName = prompt('请输入文件夹名称:')
  if (!folderName) return

  try {
    const currentPath = state.breadcrumbs[state.breadcrumbs.length - 1]?.path || '/'

    await apiClient.post(API_ENDPOINTS.files.create, {
      drive_id: state.currentDrive.id,
      folder_path: currentPath,
      file_name: folderName,
      is_folder: true,
    })

    showToast('文件夹创建成功', 'success')
    await loadFiles(state.currentDrive.id, currentPath)
  } catch (error) {
    console.error('Failed to create folder:', error)
    showToast('文件夹创建失败: ' + error.message, 'error')
  }
}

async function uploadFiles() {
  if (!state.currentDrive) {
    showToast('请先选择一个盘符', 'warning')
    return
  }

  elements.fileUploadInput.click()
}

async function deleteSelectedFiles() {
  if (state.selectedFiles.size === 0) {
    showToast('请先选择要删除的文件', 'warning')
    return
  }

  const confirmed = confirm(`确定要删除选中的 ${state.selectedFiles.size} 个文件吗?`)
  if (!confirmed) return

  try {
    const deletePromises = Array.from(state.selectedFiles).map(fileId =>
      apiClient.delete(`${API_ENDPOINTS.files.delete}/${fileId}`)
    )

    await Promise.all(deletePromises)
    showToast('文件删除成功', 'success')

    const currentPath = state.breadcrumbs[state.breadcrumbs.length - 1]?.path || '/'
    await loadFiles(state.currentDrive.id, currentPath)
  } catch (error) {
    console.error('Failed to delete files:', error)
    showToast('文件删除失败: ' + error.message, 'error')
  }
}

async function renameFile() {
  if (state.selectedFiles.size !== 1) {
    showToast('请选择一个文件进行重命名', 'warning')
    return
  }

  const fileId = Array.from(state.selectedFiles)[0]
  const file = state.files.find(f => f.id === fileId)
  if (!file) return

  const newName = prompt('请输入新的文件名:', file.file_name)
  if (!newName || newName === file.file_name) return

  try {
    await apiClient.put(`${API_ENDPOINTS.files.update}/${fileId}`, {
      file_name: newName,
    })

    showToast('文件重命名成功', 'success')

    const currentPath = state.breadcrumbs[state.breadcrumbs.length - 1]?.path || '/'
    await loadFiles(state.currentDrive.id, currentPath)
  } catch (error) {
    console.error('Failed to rename file:', error)
    showToast('文件重命名失败: ' + error.message, 'error')
  }
}

async function downloadSelectedFiles() {
  if (state.selectedFiles.size === 0) {
    showToast('请先选择要下载的文件', 'warning')
    return
  }

  // TODO: 实现文件下载逻辑
  showToast('下载功能开发中...', 'info')
}

// ==================== 文件预览 ====================
function previewFile(file) {
  if (!elements.previewModal || !elements.previewTitle || !elements.previewBody) {
    return
  }

  const type = getFileType(file.file_name)

  elements.previewTitle.textContent = file.file_name

  if (type === 'image') {
    elements.previewBody.innerHTML = `
      <div style="text-align: center;">
        <img src="${file.download_url || '/api/placeholder/800/600'}" alt="${file.file_name}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
      </div>
    `
  } else if (type === 'video') {
    elements.previewBody.innerHTML = `
      <div style="text-align: center;">
        <video controls style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
          <source src="${file.download_url}" type="video/mp4">
          您的浏览器不支持视频播放
        </video>
      </div>
    `
  } else {
    elements.previewBody.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #888; margin-bottom: 20px;">此文件类型暂不支持预览</p>
        <button class="btn btn-primary" onclick="window.fileManager.downloadFile('${file.id}')">下载文件</button>
      </div>
    `
  }

  elements.previewModal.classList.add('show')

  // 设置下载按钮
  if (elements.btnPreviewDownload) {
    elements.btnPreviewDownload.onclick = () => downloadFile(file.id)
  }
}

function closePreview() {
  if (elements.previewModal) elements.previewModal.classList.remove('show')
  if (elements.previewBody) elements.previewBody.innerHTML = ''
}

async function downloadFile(fileId) {
  // TODO: 实现单个文件下载
  showToast('下载功能开发中...', 'info')
}

// ==================== 右键菜单 ====================
function showContextMenu(event, file) {
  if (!elements.contextMenu) {
    return
  }

  event.preventDefault()
  state.contextMenuTarget = file

  elements.contextMenu.style.left = event.pageX + 'px'
  elements.contextMenu.style.top = event.pageY + 'px'
  elements.contextMenu.style.display = 'block'

  // 根据文件类型显示/隐藏某些菜单项
  const previewItem = elements.contextMenu.querySelector('[data-action="preview"]')
  if (previewItem) {
    if (file.is_folder) {
      previewItem.style.display = 'none'
    } else {
      previewItem.style.display = 'flex'
    }
  }
}

function hideContextMenu() {
  if (elements.contextMenu) {
    elements.contextMenu.style.display = 'none'
  }
  state.contextMenuTarget = null
}

function handleContextMenuAction(action) {
  const file = state.contextMenuTarget
  if (!file) return

  switch (action) {
    case 'open':
      if (file.is_folder) {
        openFolder(file)
      } else {
        previewFile(file)
      }
      break
    case 'download':
      downloadFile(file.id)
      break
    case 'rename':
      state.selectedFiles.clear()
      state.selectedFiles.add(file.id)
      renameFile()
      break
    case 'delete':
      state.selectedFiles.clear()
      state.selectedFiles.add(file.id)
      deleteSelectedFiles()
      break
    case 'preview':
      previewFile(file)
      break
    case 'properties':
      showFileProperties(file)
      break
    default:
      showToast(`功能 "${action}" 开发中...`, 'info')
  }

  hideContextMenu()
}

function showFileProperties(file) {
  alert(`文件属性:\n\n名称: ${file.file_name}\n大小: ${formatFileSize(file.file_size)}\n创建时间: ${formatDate(file.created_at)}\n修改时间: ${formatDate(file.updated_at)}`)
}

// ==================== 工具栏按钮状态 ====================
function updateToolbarButtons() {
  const hasSelection = state.selectedFiles.size > 0
  const singleSelection = state.selectedFiles.size === 1

  if (elements.btnDownload) elements.btnDownload.disabled = !hasSelection
  if (elements.btnDelete) elements.btnDelete.disabled = !hasSelection
  if (elements.btnRename) elements.btnRename.disabled = !singleSelection
}

// ==================== 视图切换 ====================
function switchView(mode) {
  state.viewMode = mode

  if (elements.btnViewGrid) elements.btnViewGrid.classList.toggle('active', mode === 'grid')
  if (elements.btnViewList) elements.btnViewList.classList.toggle('active', mode === 'list')

  renderFileList()
}

// ==================== 事件绑定 ====================
function bindEvents() {
  // 侧边栏切换 (移动端)
  elements.sidebarToggle?.addEventListener('click', () => {
    elements.sidebar?.classList.toggle('open')
  })

  // 退出登录
  elements.logoutBtn?.addEventListener('click', async () => {
    await apiClient.logout()
    window.location.href = 'auth.html'
  })

  // 工具栏按钮
  elements.btnNewFolder?.addEventListener('click', createNewFolder)
  elements.btnUploadFile?.addEventListener('click', uploadFiles)
  elements.btnDownload?.addEventListener('click', downloadSelectedFiles)
  elements.btnDelete?.addEventListener('click', deleteSelectedFiles)
  elements.btnRename?.addEventListener('click', renameFile)
  elements.btnViewGrid?.addEventListener('click', () => switchView('grid'))
  elements.btnViewList?.addEventListener('click', () => switchView('list'))
  elements.btnRefresh?.addEventListener('click', () => {
    if (state.currentDrive) {
      const currentPath = state.breadcrumbs[state.breadcrumbs.length - 1]?.path || '/'
      loadFiles(state.currentDrive.id, currentPath)
    }
  })

  // 折叠文件夹树
  elements.btnCollapseTree?.addEventListener('click', () => {
    elements.folderTreePanel?.classList.toggle('collapsed')
  })

  // 文件上传
  elements.fileUploadInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // TODO: 实现文件上传逻辑 (集成 file-uploader.js)
    showToast('上传功能开发中...', 'info')

    e.target.value = '' // 清空输入
  })

  // 搜索
  if (elements.searchInput) {
    let searchTimeout
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        const keyword = e.target.value.trim()
        if (keyword) {
          searchFiles(keyword)
        } else if (state.currentDrive) {
          const currentPath = state.breadcrumbs[state.breadcrumbs.length - 1]?.path || '/'
          loadFiles(state.currentDrive.id, currentPath)
        }
      }, 300)
    })
  }

  // 右键菜单
  document.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action
      handleContextMenuAction(action)
    })
  })

  // 点击其他地方关闭右键菜单
  if (elements.contextMenu) {
    document.addEventListener('click', (e) => {
      if (!elements.contextMenu.contains(e.target)) {
        hideContextMenu()
      }
    })
  }

  // 预览模态框
  elements.previewClose?.addEventListener('click', closePreview)
  elements.btnPreviewClose?.addEventListener('click', closePreview)
  elements.previewOverlay?.addEventListener('click', closePreview)

  // ESC 关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.previewModal?.classList.contains('show')) {
        closePreview()
      }
      if (elements.contextMenu) {
        hideContextMenu()
      }
    }
  })
}

// ==================== 搜索功能 ====================
async function searchFiles(keyword) {
  if (!state.currentDrive) return

  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.files.search}?drive_id=${state.currentDrive.id}&keyword=${encodeURIComponent(keyword)}`
    )

    state.files = response.files || []
    state.selectedFiles.clear()

    renderFileList()
    console.log(`Search found ${state.files.length} files`)
  } catch (error) {
    console.error('Failed to search files:', error)
  }
}

// ==================== 工具函数 ====================
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const day = 1000 * 60 * 60 * 24

  if (diff < day) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 7 * day) {
    const days = Math.floor(diff / day)
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

function showToast(message, type = 'info') {
  // 创建 toast 元素
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : type === 'warning' ? '#ffa94d' : '#4a9eff'};
    color: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    animation: slideInRight 0.3s ease-out;
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// ==================== 导出公共 API ====================
window.fileManager = {
  downloadFile,
  selectDrive,
  openFolder,
  previewFile,
  deleteSelectedFiles,
}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', init)

})() // 立即执行函数结束
