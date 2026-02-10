import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

async function initApp() {
    try {
        const response = await fetch('/api');
        const firebaseConfig = await response.json();
        
        const app = initializeApp(firebaseConfig);
        const storage = getStorage(app);
        
        setupEventListeners(storage);
    } catch (error) {
        console.error("Gagal memuat konfigurasi", error);
    }
}

function setupEventListeners(storage) {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadInfo = document.getElementById('uploadInfo');
    const statusText = document.getElementById('statusText');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileIcon = document.getElementById('fileIcon');
    const resultSection = document.getElementById('resultSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const uploadsList = document.getElementById('uploadsList');
    const emptyRecent = document.getElementById('emptyRecent');
    const alert = document.getElementById('alert');
    const alertMessage = document.getElementById('alertMessage');

    let selectedFile = null;
    let uploadedFiles = JSON.parse(localStorage.getItem('satriamoe_files')) || [];

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.add('click-animation');
            setTimeout(() => {
                btn.classList.remove('click-animation');
            }, 500);
            
            const sectionId = btn.getAttribute('data-section');
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
            
            if (sectionId === 'recent') {
                loadRecentUploads();
            }
        });
    });

    uploadArea.addEventListener('click', () => {
        uploadArea.classList.add('click-animation');
        setTimeout(() => {
            uploadArea.classList.remove('click-animation');
        }, 500);
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'var(--lime)';
        uploadArea.style.transform = 'translate(-3px, -3px)';
        uploadArea.style.boxShadow = 'var(--shadow)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '';
        uploadArea.style.transform = '';
        uploadArea.style.boxShadow = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.transform = '';
        uploadArea.style.boxShadow = '';
        
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        selectedFile = file;
        
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        const icon = getFileIcon(file.type, file.name);
        fileIcon.className = `fas fa-${icon}`;
        
        uploadInfo.classList.add('active');
        statusText.classList.add('active');
        progressContainer.classList.remove('active');
        
        showAlert(`File "${file.name}" siap diupload!`, 'success');
    }

    function getFileIcon(type, name) {
        if (type.startsWith('image/')) return 'file-image';
        if (type.startsWith('video/')) return 'file-video';
        if (type.startsWith('audio/')) return 'file-audio';
        if (type.includes('pdf')) return 'file-pdf';
        if (type.includes('zip') || type.includes('compressed')) return 'file-archive';
        if (type.includes('text') || name.endsWith('.txt')) return 'file-alt';
        if (type.includes('word')) return 'file-word';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'file-excel';
        return 'file';
    }

    function getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    uploadBtn.addEventListener('click', () => {
        uploadBtn.classList.add('click-animation');
        setTimeout(() => {
            uploadBtn.classList.remove('click-animation');
        }, 500);
        
        if (!selectedFile) {
            showAlert('Pilih file terlebih dahulu!', 'error');
            return;
        }
        
        statusText.classList.remove('active');
        progressContainer.classList.add('active');
        
        uploadFileToFirebase(storage);
    });

    function uploadFileToFirebase(storageInstance) {
        const file = selectedFile;
        const timestamp = Date.now();
        const storageRef = ref(storageInstance, 'uploads/' + timestamp + '_' + file.name);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            },
            (error) => {
                showAlert('Upload gagal: ' + error.message, 'error');
                uploadInfo.classList.remove('active');
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    const randomId = generateRandomId();
                    const currentDate = new Date();
                    
                    const fileData = {
                        id: randomId,
                        name: selectedFile.name,
                        size: selectedFile.size,
                        type: selectedFile.type,
                        url: downloadURL,
                        uploadDate: currentDate.toISOString(),
                        formattedDate: currentDate.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    };
                    
                    uploadedFiles.unshift(fileData);
                    localStorage.setItem('satriamoe_files', JSON.stringify(uploadedFiles));
                    
                    setTimeout(() => {
                        uploadInfo.classList.remove('active');
                        progressContainer.classList.remove('active');
                        resultSection.style.display = 'block';
                        addResultBox(fileData);
                        loadRecentUploads();
                        showAlert('File berhasil diunggah!', 'success');
                        selectedFile = null;
                        fileInput.value = '';
                    }, 500);
                });
            }
        );
    }

    function generateRandomId() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function addResultBox(fileData) {
        const icon = getFileIcon(fileData.type, fileData.name);
        const resultBox = document.createElement('div');
        resultBox.className = 'result-box';
        resultBox.innerHTML = `
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="result-info">
                    <h4>${fileData.name}</h4>
                    <p>${formatFileSize(fileData.size)} • Upload berhasil!</p>
                </div>
            </div>
            <div class="result-details">
                <div class="detail-item">
                    <div class="detail-label">Name</div>
                    <div class="detail-value">${fileData.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Creation Date</div>
                    <div class="detail-value">${fileData.formattedDate}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">URL</div>
                    <div class="detail-value">${fileData.url}</div>
                </div>
            </div>
            <div class="result-actions">
                <button class="btn btn-copy copy-url-btn" data-url="${fileData.url}">
                    <i class="fas fa-copy"></i>
                    <span>Copy URL</span>
                </button>
                <button class="btn btn-success download-btn" data-url="${fileData.url}">
                    <i class="fas fa-download"></i>
                    <span>Download</span>
                </button>
            </div>
        `;
        
        resultsContainer.prepend(resultBox);
        
        const copyBtn = resultBox.querySelector('.copy-url-btn');
        const downloadBtn = resultBox.querySelector('.download-btn');
        
        copyBtn.addEventListener('click', function() {
            this.classList.add('click-animation');
            setTimeout(() => {
                this.classList.remove('click-animation');
            }, 500);
            
            navigator.clipboard.writeText(fileData.url).then(() => {
                this.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                this.style.backgroundColor = 'var(--success)';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i><span>Copy URL</span>';
                    this.style.backgroundColor = '';
                }, 2000);
                
                showAlert('URL berhasil disalin!', 'success');
            });
        });
        
        downloadBtn.addEventListener('click', function() {
            this.classList.add('click-animation');
            setTimeout(() => {
                this.classList.remove('click-animation');
            }, 500);
            
            window.open(fileData.url, '_blank');
            showAlert('Membuka tautan download...', 'success');
        });
    }

    function loadRecentUploads() {
        uploadsList.innerHTML = '';
        
        if (uploadedFiles.length === 0) {
            emptyRecent.style.display = 'block';
            return;
        }
        
        emptyRecent.style.display = 'none';
        
        uploadedFiles.forEach(file => {
            const icon = getFileIcon(file.type, file.name);
            const uploadItem = document.createElement('div');
            uploadItem.className = 'upload-item';
            uploadItem.innerHTML = `
                <div class="upload-header">
                    <div class="upload-icon">
                        <i class="fas fa-${icon}"></i>
                    </div>
                    <div class="upload-info-history">
                        <h4>${file.name}</h4>
                        <p class="upload-details">
                            <span><i class="fas fa-calendar-alt"></i> ${file.formattedDate}</span>
                            <span> • <i class="fas fa-weight-hanging"></i> ${formatFileSize(file.size)}</span>
                        </p>
                    </div>
                </div>
                <div class="upload-url">${file.url}</div>
                <div class="upload-actions">
                    <button class="btn btn-copy copy-history-btn" data-url="${file.url}">
                        <i class="fas fa-copy"></i>
                        <span>Copy URL</span>
                    </button>
                    <button class="btn btn-visit visit-history-btn" data-url="${file.url}">
                        <i class="fas fa-external-link-alt"></i>
                        <span>Visit</span>
                    </button>
                </div>
            `;
            uploadsList.appendChild(uploadItem);
        });
        
        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.classList.add('click-animation');
                setTimeout(() => {
                    this.classList.remove('click-animation');
                }, 500);
                
                const url = this.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    showAlert('URL berhasil disalin!', 'success');
                });
            });
        });
        
        document.querySelectorAll('.visit-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.classList.add('click-animation');
                setTimeout(() => {
                    this.classList.remove('click-animation');
                }, 500);
                
                const url = this.getAttribute('data-url');
                window.open(url, '_blank');
                showAlert('Membuka tautan...', 'success');
            });
        });
    }

    function showAlert(message, type) {
        alertMessage.textContent = message;
        alert.className = `alert alert-${type} show`;
        
        setTimeout(() => {
            alert.classList.remove('show');
        }, 3000);
    }

    loadRecentUploads();
}

initApp();
