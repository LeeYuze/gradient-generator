/**
 * Gradient Pro Core Logic
 */

class GradientApp {
    constructor() {
        this.state = {
            colors: ['#fccb90', '#d57eeb'],
            angle: 135,
            image: null,
            imageSrc: null,
            imageScale: 50,
            imageRadius: 3,
            imageRotation: 0,
            imagePos: { x: 0.5, y: 0.5 },
            width: 1920,
            height: 1080,
            format: 'png',
            gridMode: false
        };

        this.moveable = null;

        this.presetsData = [
            { colors: ['#a18cd1', '#fbc2eb'], key: 'p_dreamy_purple' },
            { colors: ['#f6d365', '#fda085'], key: 'p_sunset_glow' },
            { colors: ['#a1c4fd', '#c2e9fb'], key: 'p_ocean_blue' },
            { colors: ['#84fab0', '#8fd3f4'], key: 'p_mint_fresh' },
            { colors: ['#ff9a9e', '#fecfef'], key: 'p_sakura_pink' },
            { colors: ['#85ffbd', '#fffb7d'], key: 'p_aurora_green' },
            { colors: ['#fa8bff', '#2bd2ff'], key: 'p_neon_city' },
            { colors: ['#cfd9df', '#e2ebf0'], key: 'p_morning_mist' },
            { colors: ['#f093fb', '#f5576c'], key: 'p_lemon_soda' },
            { colors: ['#0f2027', '#203a43'], key: 'p_starry_night' },
            { colors: ['#ffecd2', '#fcb69f'], key: 'p_coral_reef' },
            { colors: ['#e0c3fc', '#8ec5fc'], key: 'p_sky_mirror' }
        ];

        this.dom = this.cacheDOM();
        this.init();
    }

    cacheDOM() {
        return {
            color1: document.getElementById('color1'),
            color2: document.getElementById('color2'),
            surface1: document.getElementById('surface1'),
            surface2: document.getElementById('surface2'),
            swapBtn: document.getElementById('swapColors'),
            randomBtn: document.getElementById('randomBtn'),
            angleDial: document.getElementById('angleDial'),
            anglePointer: document.getElementById('anglePointer'),
            angleText: document.getElementById('angleText'),
            presetGrid: document.getElementById('presetGrid'),
            imageUpload: document.getElementById('imageUpload'),
            dropZone: document.getElementById('dropZone'),
            imgControls: document.getElementById('imgControls'),
            imageScale: document.getElementById('imageScale'),
            imageRadius: document.getElementById('imageRadius'),
            imageRotation: document.getElementById('imageRotation'),
            removeImgBtn: document.getElementById('removeImgBtn'),
            miniImgPreview: document.getElementById('miniImgPreview'),
            width: document.getElementById('width'),
            height: document.getElementById('height'),
            formatSelect: document.getElementById('formatSelect'),
            downloadBtn: document.getElementById('downloadBtn'),
            mainPreview: document.getElementById('mainPreview'),
            shadow: document.querySelector('.artboard-shadow'),
            cssPill: document.getElementById('copyBtn'),
            cssValue: document.querySelector('.css-value'),
            ambientBg: document.getElementById('ambientBg'),
            auroras: document.querySelectorAll('.aurora'),
            toggleGridBtn: document.getElementById('toggleGridBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn')
        };
    }

    init() {
        this.bindEvents();
        this.renderPresets();
        this.updateView(); 
        
        window.addEventListener('languageChanged', () => {
            this.renderPresets();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.randomize();
            }
        });
    }

    bindEvents() {
        const { dom } = this;

        // Colors
        const updateColor = () => {
            this.state.colors = [dom.color1.value, dom.color2.value];
            this.updateView();
        };
        dom.color1.addEventListener('input', updateColor);
        dom.color2.addEventListener('input', updateColor);
        
        dom.swapBtn.addEventListener('click', () => {
            this.state.colors.reverse();
            dom.color1.value = this.state.colors[0];
            dom.color2.value = this.state.colors[1];
            this.updateView();
        });

        dom.randomBtn.addEventListener('click', () => this.randomize());

        // Angle Logic
        let isDragging = false;
        const calculateAngle = (e) => {
            const rect = dom.angleDial.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            let deg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            deg += 90; 
            if (deg < 0) deg += 360;
            
            this.state.angle = Math.round(deg);
            this.updateView();
        };

        dom.angleDial.addEventListener('mousedown', (e) => { isDragging = true; calculateAngle(e); });
        window.addEventListener('mousemove', (e) => { if (isDragging) calculateAngle(e); });
        window.addEventListener('mouseup', () => isDragging = false);
        dom.angleDial.addEventListener('touchstart', (e) => { isDragging = true; calculateAngle(e); }, {passive: false});
        window.addEventListener('touchmove', (e) => { if (isDragging) { e.preventDefault(); calculateAngle(e); }}, {passive: false});
        window.addEventListener('touchend', () => isDragging = false);

        document.querySelectorAll('.angle-presets button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.angle = parseInt(btn.dataset.deg);
                this.updateView();
            });
        });

        // Image Dragging
        const handleImageDrag = (startEvent) => {
            if (!startEvent.target.classList.contains('preview-img')) return;

            startEvent.preventDefault();
            startEvent.stopPropagation();

            const startX = startEvent.touches ? startEvent.touches[0].clientX : startEvent.clientX;
            const startY = startEvent.touches ? startEvent.touches[0].clientY : startEvent.clientY;
            const rect = this.dom.mainPreview.getBoundingClientRect();
            const initialPos = { ...this.state.imagePos };

            const onMove = (moveEvent) => {
                moveEvent.preventDefault();
                const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const clientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
                const rawPosition = {
                    x: initialPos.x + (clientX - startX) / rect.width,
                    y: initialPos.y + (clientY - startY) / rect.height
                };
                const metrics = this.getImageDrawMetrics(rect.width, rect.height);
                const snapped = this.getSnapResult(rawPosition, metrics, rect);
                this.state.imagePos = snapped.position;
                this.applyImageTransform(startEvent.target);
                this.updateSnapGuides(snapped.guides);
                this.moveable && this.moveable.updateRect();
            };

            const onUp = () => {
                this.clearSnapGuides();
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onUp);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchmove', onMove, {passive: false});
            window.addEventListener('touchend', onUp);
        };

        this.dom.mainPreview.addEventListener('mousedown', handleImageDrag);
        this.dom.mainPreview.addEventListener('touchstart', handleImageDrag, {passive: false});

        // Image Upload
        dom.imageUpload.addEventListener('change', (e) => this.handleImage(e.target.files[0]));
        dom.dropZone.addEventListener('click', () => { dom.imageUpload.click(); });
        
        const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            dom.dropZone.addEventListener(evt, prevent);
        });
        dom.dropZone.addEventListener('dragover', () => dom.dropZone.style.borderColor = 'var(--accent)');
        dom.dropZone.addEventListener('dragleave', () => dom.dropZone.style.borderColor = '');
        dom.dropZone.addEventListener('drop', (e) => {
            dom.dropZone.style.borderColor = '';
            this.handleImage(e.dataTransfer.files[0]);
        });

        dom.removeImgBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.state.image = null;
            this.state.imageSrc = null;
            dom.imageUpload.value = '';
            this.updateView();
        });

        dom.imageScale.addEventListener('input', (e) => {
            this.state.imageScale = parseInt(e.target.value);
            this.updateView();
        });

        dom.imageRotation.addEventListener('input', (e) => {
            this.state.imageRotation = parseInt(e.target.value);
            this.updateView();
        });

        dom.imageRadius.addEventListener('input', (e) => {
            this.state.imageRadius = parseInt(e.target.value);
            this.updateView();
        });

        dom.width.addEventListener('input', (e) => { this.state.width = parseInt(e.target.value) || 1920; this.updateView(); });
        dom.height.addEventListener('input', (e) => { this.state.height = parseInt(e.target.value) || 1080; this.updateView(); });
        dom.formatSelect.addEventListener('change', (e) => this.state.format = e.target.value);
        dom.downloadBtn.addEventListener('click', () => this.download());

        // Toolbar
        dom.cssPill.addEventListener('click', (e) => {
            if(e.target.classList.contains('action-copy')) this.copyCSS();
        });
        dom.toggleGridBtn.addEventListener('click', () => {
            this.state.gridMode = !this.state.gridMode;
            this.updateView();
        });
        dom.fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) dom.mainPreview.requestFullscreen().catch(err => {});
            else document.exitFullscreen();
        });
    }

    handleImage(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.state.image = img;
                this.state.imageSrc = e.target.result;
                this.state.imageRotation = 0;
                this.state.imagePos = { x: 0.5, y: 0.5 };
                this.dom.imageRotation.value = this.state.imageRotation;
                this.updateView();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    randomize() {
        const r = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        this.state.colors = [r(), r()];
        this.state.angle = Math.floor(Math.random() * 360);
        this.dom.color1.value = this.state.colors[0];
        this.dom.color2.value = this.state.colors[1];
        this.updateView();
    }

    updateView() {
        const { dom, state } = this;
        dom.surface1.style.backgroundColor = state.colors[0];
        dom.surface2.style.backgroundColor = state.colors[1];
        dom.angleText.textContent = state.angle;
        dom.anglePointer.style.transform = `translate(-50%, 0) rotate(${state.angle}deg)`;

        const gradient = `linear-gradient(${state.angle}deg, ${state.colors[0]} 0%, ${state.colors[1]} 100%)`;
        dom.mainPreview.style.background = gradient;
        dom.shadow.style.background = gradient;
        dom.cssValue.textContent = `linear-gradient(${state.angle}deg, ${state.colors[0]}, ${state.colors[1]})`;
        this.adjustAspectRatio();

        this.destroyMoveable();
        dom.mainPreview.innerHTML = '';
        if (state.imageSrc) {
            const img = document.createElement('img');
            img.src = state.imageSrc;
            img.className = 'preview-img';
            dom.mainPreview.appendChild(img);
            this.applyImageTransform(img);
            
            dom.dropZone.classList.add('has-image');
            dom.miniImgPreview.style.backgroundImage = `url(${state.imageSrc})`;
            dom.imgControls.style.display = 'flex';
            dom.imageScale.value = state.imageScale;
            dom.imageRotation.value = state.imageRotation;
            dom.imageRadius.value = state.imageRadius;
        } else {
            dom.dropZone.classList.remove('has-image');
            dom.imgControls.style.display = 'none';
        }

        dom.auroras[0].style.background = state.colors[0];
        dom.auroras[1].style.background = state.colors[1];
        dom.auroras[2].style.background = this.blendColors(state.colors[0], state.colors[1], 0.5);

        if (state.gridMode) dom.mainPreview.classList.add('grid-mode');
        else dom.mainPreview.classList.remove('grid-mode');

        this.initMoveable();
    }

    adjustAspectRatio() {
        const { dom, state } = this;
        // 修正：现在我们有顶部工具栏，所以高度要重新计算
        const stage = dom.mainPreview.closest('.canvas-stage');
        if(!stage) return;
        
        const maxWidth = stage.clientWidth - 40;
        const maxHeight = stage.clientHeight - 40;
        
        const ratio = state.width / state.height;
        let finalW, finalH;

        if (maxWidth / maxHeight > ratio) {
            finalH = maxHeight;
            finalW = finalH * ratio;
        } else {
            finalW = maxWidth;
            finalH = finalW / ratio;
        }

        dom.mainPreview.style.width = `${finalW}px`;
        dom.mainPreview.style.height = `${finalH}px`;
        dom.shadow.style.width = `${finalW}px`;
        dom.shadow.style.height = `${finalH}px`;
    }

    getImageWidthPercent() {
        return this.state.imageScale;
    }

    getImageDrawMetrics(width, height) {
        const { state } = this;
        if (!state.image) return null;

        const imgRatio = state.image.width / state.image.height || 1;
        const drawW = width * (this.getImageWidthPercent() / 100);
        const drawH = drawW / imgRatio;
        const centerX = state.imagePos.x * width;
        const centerY = state.imagePos.y * height;

        return { drawW, drawH, centerX, centerY };
    }

    applyImageTransform(target) {
        const { state } = this;
        const rect = this.dom.mainPreview.getBoundingClientRect();
        const metrics = this.getImageDrawMetrics(rect.width, rect.height);
        if (!metrics) return;

        const x = metrics.centerX - metrics.drawW / 2;
        const y = metrics.centerY - metrics.drawH / 2;

        target.style.width = `${this.getImageWidthPercent()}%`;
        target.style.left = '0';
        target.style.top = '0';
        target.style.borderRadius = `${state.imageRadius}%`;
        target.style.transform = `translate(${x}px, ${y}px) rotate(${state.imageRotation}deg)`;
    }

    getSnapResult(position, metrics, rect) {
        const threshold = 8;
        const next = { ...position };
        const guides = { x: null, y: null };
        const angle = Math.abs(this.state.imageRotation) * Math.PI / 180;
        const snapWidth = Math.abs(metrics.drawW * Math.cos(angle)) + Math.abs(metrics.drawH * Math.sin(angle));
        const snapHeight = Math.abs(metrics.drawW * Math.sin(angle)) + Math.abs(metrics.drawH * Math.cos(angle));

        const snapAxis = (axis, centerValue, size, stageSize) => {
            const half = size / 2;
            const anchors = [
                { value: centerValue - half, offset: half },
                { value: centerValue, offset: 0 },
                { value: centerValue + half, offset: -half }
            ];
            const targets = [0, stageSize / 2, stageSize];
            let best = null;

            anchors.forEach(anchor => {
                targets.forEach(target => {
                    const distance = Math.abs(anchor.value - target);
                    if (distance <= threshold && (!best || distance < best.distance)) {
                        best = {
                            distance,
                            centerValue: target + anchor.offset,
                            guidePercent: (target / stageSize) * 100
                        };
                    }
                });
            });

            if (!best) return centerValue;
            guides[axis] = best.guidePercent;
            return best.centerValue;
        };

        const centerX = snapAxis('x', position.x * rect.width, snapWidth, rect.width);
        const centerY = snapAxis('y', position.y * rect.height, snapHeight, rect.height);
        next.x = centerX / rect.width;
        next.y = centerY / rect.height;

        return { position: next, guides };
    }

    ensureSnapGuides() {
        const { mainPreview } = this.dom;
        let vertical = mainPreview.querySelector('.snap-guide-vertical');
        let horizontal = mainPreview.querySelector('.snap-guide-horizontal');

        if (!vertical) {
            vertical = document.createElement('div');
            vertical.className = 'snap-guide snap-guide-vertical';
            mainPreview.appendChild(vertical);
        }

        if (!horizontal) {
            horizontal = document.createElement('div');
            horizontal.className = 'snap-guide snap-guide-horizontal';
            mainPreview.appendChild(horizontal);
        }

        return { vertical, horizontal };
    }

    updateSnapGuides(guides) {
        const { vertical, horizontal } = this.ensureSnapGuides();

        if (guides.x === null) {
            vertical.classList.remove('is-visible');
        } else {
            vertical.style.left = `${guides.x}%`;
            vertical.classList.add('is-visible');
        }

        if (guides.y === null) {
            horizontal.classList.remove('is-visible');
        } else {
            horizontal.style.top = `${guides.y}%`;
            horizontal.classList.add('is-visible');
        }
    }

    clearSnapGuides() {
        this.dom.mainPreview.querySelectorAll('.snap-guide').forEach(guide => {
            guide.classList.remove('is-visible');
        });
    }

    initMoveable() {
        const target = this.dom.mainPreview.querySelector('.preview-img');
        if (!target || !window.Moveable) {
            this.destroyMoveable();
            return;
        }

        if (!this.moveable) {
            this.moveable = new Moveable(this.dom.mainPreview, {
                target,
                draggable: true,
                resizable: true,
                rotatable: true,
                snappable: false,
                snapCenter: true,
                snapGap: false,
                snapThreshold: 6,
                origin: false,
                keepRatio: true,
                throttleDrag: 0,
                throttleResize: 0,
                throttleRotate: 0,
                renderDirections: ['nw', 'ne', 'sw', 'se'],
                rotationPosition: 'top'
            });

            this.moveable
                .on('dragStart', ({ set }) => {
                    const rect = this.dom.mainPreview.getBoundingClientRect();
                    const metrics = this.getImageDrawMetrics(rect.width, rect.height);
                    set([metrics.centerX - metrics.drawW / 2, metrics.centerY - metrics.drawH / 2]);
                })
                .on('drag', ({ beforeTranslate }) => {
                    const rect = this.dom.mainPreview.getBoundingClientRect();
                    const metrics = this.getImageDrawMetrics(rect.width, rect.height);
                    const rawPosition = {
                        x: (beforeTranslate[0] + metrics.drawW / 2) / rect.width,
                        y: (beforeTranslate[1] + metrics.drawH / 2) / rect.height
                    };
                    const snapped = this.getSnapResult(rawPosition, metrics, rect);
                    this.state.imagePos = snapped.position;
                    this.applyImageTransform(target);
                    this.updateSnapGuides(snapped.guides);
                    this.moveable && this.moveable.updateRect();
                })
                .on('resizeStart', ({ setOrigin, dragStart }) => {
                    setOrigin(['50%', '50%']);
                    const rect = this.dom.mainPreview.getBoundingClientRect();
                    const metrics = this.getImageDrawMetrics(rect.width, rect.height);
                    dragStart && dragStart.set([metrics.centerX - metrics.drawW / 2, metrics.centerY - metrics.drawH / 2]);
                })
                .on('resize', ({ width, drag }) => {
                    const rect = this.dom.mainPreview.getBoundingClientRect();
                    this.state.imageScale = Math.max(5, Math.min(300, Math.round((width / rect.width) * 100)));
                    if (drag) {
                        const metrics = this.getImageDrawMetrics(rect.width, rect.height);
                        const rawPosition = {
                            x: (drag.beforeTranslate[0] + metrics.drawW / 2) / rect.width,
                            y: (drag.beforeTranslate[1] + metrics.drawH / 2) / rect.height
                        };
                        const snapped = this.getSnapResult(rawPosition, metrics, rect);
                        this.state.imagePos = snapped.position;
                        this.updateSnapGuides(snapped.guides);
                    }
                    this.applyImageTransform(target);
                    this.dom.imageScale.value = this.state.imageScale;
                    this.moveable && this.moveable.updateRect();
                })
                .on('rotateStart', ({ set }) => {
                    set(this.state.imageRotation);
                })
                .on('rotate', ({ beforeRotate }) => {
                    this.state.imageRotation = Math.round(beforeRotate);
                    this.applyImageTransform(target);
                    this.dom.imageRotation.value = this.state.imageRotation;
                })
                .on('renderEnd', () => {
                    this.clearSnapGuides();
                    this.moveable && this.moveable.updateRect();
                });
        } else {
            this.moveable.target = target;
            this.moveable.updateRect();
        }
    }

    destroyMoveable() {
        if (!this.moveable) return;
        this.moveable.destroy();
        this.moveable = null;
    }

    copyCSS() {
        const css = `background: linear-gradient(${this.state.angle}deg, ${this.state.colors[0]} 0%, ${this.state.colors[1]} 100%);`;
        navigator.clipboard.writeText(css).then(() => {
            this.showToast('<i class="fas fa-check-circle"></i> CSS 已复制');
        });
    }

    showToast(html) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = html;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    download() {
        const { state } = this;
        const btn = this.dom.downloadBtn;
        btn.querySelector('.btn-text').style.opacity = '0';
        btn.querySelector('.btn-icon').style.opacity = '0';
        btn.classList.add('loading');
        
        setTimeout(() => {
            if (state.format === 'svg') {
                this.downloadSVG();
            } else {
                const canvas = document.createElement('canvas');
                canvas.width = state.width;
                canvas.height = state.height;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                
                const angleRad = (state.angle - 180) * (Math.PI / 180); 
                const segmentLength = Math.abs(w * Math.sin(angleRad)) + Math.abs(h * Math.cos(angleRad));
                const x1 = w/2 + Math.sin(angleRad) * segmentLength/2;
                const y1 = h/2 - Math.cos(angleRad) * segmentLength/2;
                const x2 = w/2 - Math.sin(angleRad) * segmentLength/2;
                const y2 = h/2 + Math.cos(angleRad) * segmentLength/2;

                const grad = ctx.createLinearGradient(x1, y1, x2, y2);
                grad.addColorStop(0, state.colors[0]);
                grad.addColorStop(1, state.colors[1]);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                if (state.image) {
                    const img = state.image;
                    const metrics = this.getImageDrawMetrics(w, h);
                    if (!metrics) return;
                    const { drawW, drawH, centerX, centerY } = metrics;
                    const dx = -drawW / 2;
                    const dy = -drawH / 2;

                    // Handle Corner Radius
                    ctx.save();
                    ctx.translate(centerX, centerY);
                    ctx.rotate(state.imageRotation * Math.PI / 180);

                    if (state.imageRadius > 0) {
                        const rX = drawW * (state.imageRadius / 100);
                        const rY = drawH * (state.imageRadius / 100);
                        
                        ctx.beginPath();
                        // Custom rounded rect implementation to handle non-uniform scaling if necessary,
                        // but here we use standard ellipse arc logic which matches border-radius % behavior roughly
                        // Start from top-left
                        ctx.moveTo(dx + rX, dy);
                        ctx.lineTo(dx + drawW - rX, dy);
                        ctx.quadraticCurveTo(dx + drawW, dy, dx + drawW, dy + rY);
                        ctx.lineTo(dx + drawW, dy + drawH - rY);
                        ctx.quadraticCurveTo(dx + drawW, dy + drawH, dx + drawW - rX, dy + drawH);
                        ctx.lineTo(dx + rX, dy + drawH);
                        ctx.quadraticCurveTo(dx, dy + drawH, dx, dy + drawH - rY);
                        ctx.lineTo(dx, dy + rY);
                        ctx.quadraticCurveTo(dx, dy, dx + rX, dy);
                        ctx.closePath();
                        
                        ctx.clip();
                        ctx.drawImage(img, dx, dy, drawW, drawH);
                    } else {
                        ctx.drawImage(img, dx, dy, drawW, drawH);
                    }

                    ctx.restore();
                }

                const link = document.createElement('a');
                link.download = `gradient-pro-${Date.now()}.${state.format}`;
                link.href = canvas.toDataURL(`image/${state.format}`, 0.95);
                link.click();
            }

            btn.querySelector('.btn-text').style.opacity = '1';
            btn.querySelector('.btn-icon').style.opacity = '1';
            btn.classList.remove('loading');
        }, 100);
    }

    downloadSVG() {
        const { state } = this;
        const w = state.width;
        const h = state.height;
        
        const angleRad = (state.angle - 180) * (Math.PI / 180); 
        const segmentLength = Math.abs(w * Math.sin(angleRad)) + Math.abs(h * Math.cos(angleRad));
        const x1 = w/2 + Math.sin(angleRad) * segmentLength/2;
        const y1 = h/2 - Math.cos(angleRad) * segmentLength/2;
        const x2 = w/2 - Math.sin(angleRad) * segmentLength/2;
        const y2 = h/2 + Math.cos(angleRad) * segmentLength/2;

        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
        <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
            <stop offset="0%" stop-color="${state.colors[0]}" />
            <stop offset="100%" stop-color="${state.colors[1]}" />
        </linearGradient>`;

        let imageGroup = '';
        if (state.image) {
            const metrics = this.getImageDrawMetrics(w, h);
            const { drawW, drawH, centerX, centerY } = metrics;
            const dx = -drawW / 2;
            const dy = -drawH / 2;
            const transform = `translate(${centerX} ${centerY}) rotate(${state.imageRotation})`;

            if (state.imageRadius > 0) {
                const rX = drawW * (state.imageRadius / 100);
                const rY = drawH * (state.imageRadius / 100);
                svgContent += `
        <clipPath id="clip">
            <rect x="${dx}" y="${dy}" width="${drawW}" height="${drawH}" rx="${rX}" ry="${rY}" />
        </clipPath>`;
                imageGroup = `<g transform="${transform}"><image href="${state.imageSrc}" x="${dx}" y="${dy}" width="${drawW}" height="${drawH}" clip-path="url(#clip)" preserveAspectRatio="none" /></g>`;
            } else {
                imageGroup = `<g transform="${transform}"><image href="${state.imageSrc}" x="${dx}" y="${dy}" width="${drawW}" height="${drawH}" preserveAspectRatio="none" /></g>`;
            }
        }

        svgContent += `
    </defs>
    <rect width="${w}" height="${h}" fill="url(#grad)" />
    ${imageGroup}
</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `gradient-pro-${Date.now()}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }

    renderPresets() {
        const container = this.dom.presetGrid;
        container.innerHTML = ''; 
        
        this.presetsData.forEach(p => {
            const div = document.createElement('div');
            div.className = 'preset-item';
            div.style.background = `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'preset-name';
            nameSpan.textContent = window.langManager ? window.langManager.get(p.key) : 'Preset';
            div.appendChild(nameSpan);

            div.onclick = () => {
                this.state.colors = [...p.colors];
                this.dom.color1.value = p.colors[0];
                this.dom.color2.value = p.colors[1];
                this.updateView();
                document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
            };
            container.appendChild(div);
        });
    }

    blendColors(c1, c2, percent) {
        const f = parseInt(c1.slice(1), 16),
              t = parseInt(c2.slice(1), 16),
              R1 = f >> 16, G1 = f >> 8 & 0x00FF, B1 = f & 0x0000FF,
              R2 = t >> 16, G2 = t >> 8 & 0x00FF, B2 = t & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((R2 - R1) * percent) + R1) * 0x10000 
                     + (Math.round((G2 - G1) * percent) + G1) * 0x100 
                     + (Math.round((B2 - B1) * percent) + B1)).toString(16).slice(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new GradientApp();
});
