// 调试工具
const Debug = {
    enabled: true,
    log: function(message, data = null) {
        if (this.enabled) {
            console.log(`[Debug] ${message}`, data || '');
        }
    },
    error: function(message, error = null) {
        if (this.enabled) {
            console.error(`[Error] ${message}`, error || '');
        }
    }
};

// 状态管理
const State = {
    currentFile: null,
    files: [],
    processing: false
};

// DOM 元素
const Elements = {
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    qualitySlider: document.getElementById('quality'),
    qualityValue: document.getElementById('qualityValue'),
    maxWidth: document.getElementById('maxWidth'),
    originalPreview: document.getElementById('originalPreview'),
    compressedPreview: document.getElementById('compressedPreview'),
    originalInfo: document.getElementById('originalInfo'),
    compressedInfo: document.getElementById('compressedInfo'),
    fileList: document.getElementById('fileList'),
    compressAll: document.getElementById('compressAll'),
    downloadAll: document.getElementById('downloadAll')
};

// 初始化事件监听
function initializeEventListeners() {
    Debug.log('初始化事件监听器');
    
    Elements.fileInput.addEventListener('change', handleFileSelect);
    Elements.dropZone.addEventListener('dragover', handleDragOver);
    Elements.dropZone.addEventListener('dragleave', handleDragLeave);
    Elements.dropZone.addEventListener('drop', handleDrop);
    Elements.qualitySlider.addEventListener('input', handleQualityChange);
    Elements.compressAll.addEventListener('click', handleCompressAll);
    Elements.downloadAll.addEventListener('click', handleDownloadAll);
}

// 文件处理
function handleFileSelect(event) {
    Debug.log('处理文件选择');
    const files = event.target.files;
    processFiles(files);
}

// 拖拽相关的处理函数
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    Elements.dropZone.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    Elements.dropZone.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    Elements.dropZone.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    processFiles(files);
}

// 文件处理函数
function processFiles(files) {
    Debug.log('处理文件', files);
    if (!files.length) return;

    // 清理之前的预览
    clearPreviews();
    
    // 更新状态
    State.files = Array.from(files);
    State.currentFile = files[0];
    
    // 显示第一个文件的预览
    displayPreview(State.currentFile);
}

// 清理预览
function clearPreviews() {
    Debug.log('清理预览区域');
    Elements.originalPreview.innerHTML = '';
    Elements.compressedPreview.innerHTML = '';
    Elements.originalInfo.textContent = '';
    Elements.compressedInfo.textContent = '';
}

// 预览显示函数
function displayPreview(file) {
    Debug.log('显示预览', file.name);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            // 显示原图预览
            Elements.originalPreview.innerHTML = '';
            Elements.originalPreview.appendChild(img.cloneNode());
            Elements.originalInfo.textContent = `${file.name} (${formatSize(file.size)})`;
            
            // 压缩图片
            compressImage(file).then(showCompressedPreview);
        };
    };
    reader.readAsDataURL(file);
}

// 压缩图片
async function compressImage(file) {
    try {
        Debug.log('开始压缩图片', file.name);
        
        const quality = Elements.qualitySlider.value / 100;
        const maxWidth = parseInt(Elements.maxWidth.value);
        
        // 创建一个临时的 canvas 来压缩图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = await createImageBitmap(file);
        
        // 计算新的尺寸
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, file.type, quality);
        });
    } catch (error) {
        Debug.error('压缩图片失败', error);
        showStatus('压缩失败：' + error.message, 'error');
        throw error;
    }
}

// 压缩后预览函数
function showCompressedPreview(blob) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    img.onload = function() {
        Elements.compressedPreview.innerHTML = '';
        Elements.compressedPreview.appendChild(img);
        Elements.compressedInfo.textContent = `压缩后大小: ${formatSize(blob.size)}`;
    };
}

// 工具函数
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 显示状态消息
function showStatus(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type} show`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// 质量滑块处理函数
function handleQualityChange(event) {
    const value = event.target.value;
    Elements.qualityValue.textContent = value + '%';
    if (State.currentFile) {
        displayPreview(State.currentFile);
    }
}

// 批量处理函数
function handleCompressAll() {
    if (!State.files.length) {
        showStatus('请先选择图片', 'warning');
        return;
    }
    
    Debug.log('开始批量压缩');
    Promise.all(State.files.map(compressImage))
        .then(blobs => {
            // 处理压缩后的文件...
            showStatus('批量压缩完成', 'success');
        })
        .catch(error => {
            showStatus('批量压缩失败', 'error');
        });
}

function handleDownloadAll() {
    if (!State.files.length) {
        showStatus('没有可下载的文件', 'warning');
        return;
    }
    
    Debug.log('开始批量下载');
    // TODO: 实现批量下载逻辑
}

// 初始化应用
function initializeApp() {
    Debug.log('应用初始化');
    initializeEventListeners();
    checkBrowserSupport();
}

// 检查浏览器支持
function checkBrowserSupport() {
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        Debug.error('浏览器不支持必要的 API');
        showStatus('您的浏览器可能不支持某些功能，请使用现代浏览器。', 'warning');
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeApp);