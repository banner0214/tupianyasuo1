// 获取DOM元素
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.querySelector('.preview-container');
const originalImage = document.getElementById('originalImage');
const compressedImage = document.getElementById('compressedImage');
const originalSize = document.getElementById('originalSize');
const compressedSize = document.getElementById('compressedSize');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const downloadBtn = document.getElementById('downloadBtn');

// 文件上传处理
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#0071e3';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#c7c7c7';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#c7c7c7';
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// 处理上传的文件
function handleFile(file) {
    if (!file.type.match(/image\/(png|jpeg)/)) {
        alert('请上传PNG或JPG格式的图片！');
        return;
    }

    // 显示原始文件大小
    originalSize.textContent = formatFileSize(file.size);

    // 预览原图
    const reader = new FileReader();
    reader.onload = (e) => {
        originalImage.src = e.target.result;
        compressImage(e.target.result);
    };
    reader.readAsDataURL(file);
    
    previewContainer.style.display = 'block';
}

// 压缩图片
function compressImage(base64) {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const quality = qualitySlider.value / 100;
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        compressedImage.src = compressedBase64;
        
        // 计算压缩后的大小
        const compressedBytes = Math.round((compressedBase64.length - 22) * 3 / 4);
        compressedSize.textContent = formatFileSize(compressedBytes);
    };
}

// 质量滑块事件
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value + '%';
    if (originalImage.src) {
        compressImage(originalImage.src);
    }
});

// 下载按钮事件
downloadBtn.addEventListener('click', () => {
    if (!compressedImage.src) return;
    
    const link = document.createElement('a');
    link.download = 'compressed_image.jpg';
    link.href = compressedImage.src;
    link.click();
});

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 