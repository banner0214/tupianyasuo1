// 全局变量
let currentFiles = [];
const maxFileSize = 10 * 1024 * 1024; // 10MB

// DOM 元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const maxWidthInput = document.getElementById('maxWidth');
const fileList = document.getElementById('fileList');
const compressAllBtn = document.getElementById('compressAll');
const downloadAllBtn = document.getElementById('downloadAll');

// 事件监听器
document.addEventListener('DOMContentLoaded', initializeApp);
fileInput.addEventListener('change', handleFileSelect);
qualitySlider.addEventListener('input', updateQualityValue);
compressAllBtn.addEventListener('click', compressAllImages);
downloadAllBtn.addEventListener('click', downloadAllImages);

// 拖放功能
setupDragAndDrop();

// 初始化应用
function initializeApp() {
    setupDragAndDrop();
    updateQualityValue();
}

// 设置拖放功能
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight);
    });

    dropZone.addEventListener('drop', handleDrop);
}

// 阻止默认行为
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// 高亮拖放区域
function highlight(e) {
    dropZone.classList.add('drag-over');
}

// 取消高亮
function unhighlight(e) {
    dropZone.classList.remove('drag-over');
}

// 处理文件拖放
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// 处理文件选择
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file => {
        if (!file.type.startsWith('image/')) {
            alert('请只上传图片文件');
            return false;
        }
        if (file.size > maxFileSize) {
            alert(`文件 ${file.name} 太大，请上传小于 10MB 的文件`);
            return false;
        }
        return true;
    });

    currentFiles = [...currentFiles, ...imageFiles];
    updateFileList();
}

// 更新文件列表显示
function updateFileList() {
    fileList.innerHTML = '';
    currentFiles.forEach((file, index) => {
        const fileItem = createFileListItem(file, index);
        fileList.appendChild(fileItem);
    });
}

// 创建文件列表项
function createFileListItem(file, index) {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
        <span>${file.name} (${formatFileSize(file.size)})</span>
        <button onclick="removeFile(${index})">删除</button>
    `;
    return div;
}

// 移除文件
function removeFile(index) {
    currentFiles.splice(index, 1);
    updateFileList();
}

// 更新质量显示值
function updateQualityValue() {
    qualityValue.textContent = `${qualitySlider.value}%`;
}

// 压缩图片
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // 计算新尺寸
                let width = img.width;
                let height = img.height;
                const maxWidth = parseInt(maxWidthInput.value);

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);

                // 转换为 blob
                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    'image/jpeg',
                    qualitySlider.value / 100
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 压缩所有图片
async function compressAllImages() {
    if (currentFiles.length === 0) {
        alert('请先选择图片');
        return;
    }

    const compressedFiles = [];
    for (const file of currentFiles) {
        const compressedBlob = await compressImage(file);
        compressedFiles.push({
            blob: compressedBlob,
            name: file.name
        });
    }

    // 更新压缩后的文件
    currentFiles = compressedFiles.map(({ blob, name }) => 
        new File([blob], name, { type: 'image/jpeg' })
    );
    
    updateFileList();
    alert('所有图片压缩完成！');
}

// 下载所有图片
function downloadAllImages() {
    if (currentFiles.length === 0) {
        alert('没有可下载的图片');
        return;
    }

    currentFiles.forEach(file => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = `compressed_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 