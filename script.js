function extractAvgColor(imageElement, sampleRatio = 30) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = imageElement.naturalWidth || imageElement.width || 1;
    canvas.height = imageElement.naturalHeight || imageElement.height || 1;

    try {
        context.drawImage(imageElement, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let pixelCount = 0;
        
        for (let i = 0; i < data.length; i += 4 * sampleRatio) {
            r += data[i];     
            g += data[i + 1]; 
            b += data[i + 2]; 
            pixelCount++;
        }
        
        const avgR = Math.floor((r / pixelCount) * 0.4);
        const avgG = Math.floor((g / pixelCount) * 0.4);
        const avgB = Math.floor((b / pixelCount) * 0.4);
        
        return `rgb(${avgR}, ${avgG}, ${avgB})`;
    } catch (error) {
        return '#1a1c1e'; 
    }
}


window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (!nav) {
        return;
    }
    
    if (window.scrollY > 450) {
        nav.classList.add('nav-visible');
    } else {
        nav.classList.remove('nav-visible');
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    const gallery = document.querySelector('.gallery');
    
    const mediaItems   = gallery ? Array.from(gallery.querySelectorAll('.gallery-item')) : [];
    const articleItems = gallery ? Array.from(gallery.querySelectorAll('.article-card')) : [];
    
    let currentColumnsCount = 0;

    function getColumnCount() {
        const width = window.innerWidth;
        if (width <= 550) {
            return 1;
        }
        if (width <= 900) {
            return 2;
        }
        if (width <= 1250) {
            return 3;
        }
        if (width <= 1600) {
            return 4;
        }
        return 5;
    }

    function rebuildMediaGallery(forceRebuild = false) {
        if (!gallery || mediaItems.length === 0) {
            return;
        }
        if (document.fullscreenElement) {
            return;
        }

        const targetColumnsCount = getColumnCount();
        const checkedBoxes = Array.from(document.querySelectorAll('.tag-checkbox:checked'));
        const selectedTags = checkedBoxes.map(cb => cb.value);

        const filteredItems = mediaItems.filter(item => {
            if (selectedTags.length === 0) {
                return true;
            }
            const itemTags = item.dataset.tags ? item.dataset.tags.split(' ') : [];
            return selectedTags.every(tag => itemTags.includes(tag));
        });

        if (targetColumnsCount === currentColumnsCount && !forceRebuild) {
            return;
        }
        currentColumnsCount = targetColumnsCount;

        gallery.innerHTML = '';

        const columnElements = [];
        for (let i = 0; i < targetColumnsCount; i++) {
            const column = document.createElement('div');
            column.className = 'gallery-column';
            gallery.appendChild(column);
            columnElements.push(column);
        }

        filteredItems.forEach((item, index) => {
            const targetColumnIndex = index % targetColumnsCount;
            columnElements[targetColumnIndex].appendChild(item);

            const videoInItem = item.querySelector('video');
            if (videoInItem) {
                videoInItem.play().catch(err => console.log(err));
            }
        });
    }

    function rebuildArticleGallery() {
        if (!gallery || articleItems.length === 0) {
            return;
        }

        const checkedBoxes = Array.from(document.querySelectorAll('.tag-checkbox:checked'));
        const selectedTags = checkedBoxes.map(cb => cb.value.toLowerCase());

        articleItems.forEach(item => {
            const itemTags = Array.from(item.querySelectorAll('.tags .tag'))
                .map(t => t.textContent.trim().replace('#', '').toLowerCase());
            
            const matchesFilter = selectedTags.length === 0 || 
                selectedTags.every(tag => itemTags.includes(tag));
            
            const container = item.closest('.article-section') || item;

            if (matchesFilter) {
                container.style.display = '';
            } else {
                container.style.display = 'none';
            }
        });
    }

    const videos = document.querySelectorAll('.gallery-image video');
    videos.forEach(video => {
        const parent = video.parentElement;
        if (!parent) {
            return;
        }

        parent.addEventListener('mouseenter', () => {
            video.controls = true;
        });
        
        parent.addEventListener('mouseleave', () => {
            if (document.fullscreenElement !== video) {
                video.controls = false;
            }
        });
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            videos.forEach(v => v.controls = false);
            rebuildMediaGallery(true);
        }
    });

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div class="modal-left">
            <img src="" alt="Media" class="main-media" style="display: none;">
            <video autoplay muted loop controls class="main-media" style="display: none;"></video>
        </div>
        <div class="modal-right">
            <h3 class="modal-title"></h3>
            <p class="modal-description"></p>
            <div class="tags"></div>
        </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const modalLeft  = modalOverlay.querySelector('.modal-left');
    const modalImg   = modalOverlay.querySelector('.modal-left img');
    const modalVideo = modalOverlay.querySelector('.modal-left video');
    const modalTitle = modalOverlay.querySelector('.modal-title');
    const modalDesc  = modalOverlay.querySelector('.modal-description');
    const modalTags  = modalOverlay.querySelector('.tags');
    const modalClose = modalOverlay.querySelector('.modal-close');

    mediaItems.forEach(item => {
        item.addEventListener('click', () => {
            const cardImg   = item.querySelector('.gallery-image img');
            const cardVideo = item.querySelector('.gallery-image video');
            const cardTitle = item.querySelector('.artwork-title');
            const cardDesc  = item.querySelector('.artwork-description');
            const cardTags  = item.querySelector('.tags');

            modalTitle.textContent = cardTitle ? cardTitle.textContent : '';
            modalDesc.textContent = cardDesc ? cardDesc.textContent : '';
            modalTags.innerHTML = cardTags ? cardTags.innerHTML : '';

            if (cardImg) {
                modalVideo.style.display = 'none';
                modalVideo.src = ''; 
                
                modalImg.style.display = 'block';
                modalLeft.style.setProperty('--modal-bg-color', '#1a1c1e');
                
                modalImg.crossOrigin = "anonymous";
                modalImg.src = cardImg.src;
                
                modalImg.onload = () => {
                    const calculatedColor = extractAvgColor(modalImg, 30);
                    modalLeft.style.setProperty('--modal-bg-color', calculatedColor);
                };
            } 
            else if (cardVideo) {
                modalImg.style.display = 'none';
                modalImg.src = '';
                
                modalVideo.style.display = 'block';
                const source = cardVideo.querySelector('source');
                modalVideo.src = source ? source.src : cardVideo.src;
                
                modalLeft.style.setProperty('--modal-bg-color', '#000000');
                modalVideo.play();
            }

            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        modalVideo.pause();
        modalVideo.src = '';
        modalImg.src = '';
    };

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    document.querySelectorAll('.tag-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            rebuildMediaGallery(true);
            rebuildArticleGallery();
        });
    });

    rebuildMediaGallery();
    rebuildArticleGallery();
    
    window.addEventListener('resize', () => {
        rebuildMediaGallery(false);
    });
});