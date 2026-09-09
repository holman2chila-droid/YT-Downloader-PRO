/**
 * YT Downloader PRO — Main Application Logic
 * Handles UI interactions, video preview, real-time download tracking, and direct browser file delivery.
 */

// ============================
// DOM Elements
// ============================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const elements = {
    navbar: $('#navbar'),
    navToggle: $('#nav-toggle'),
    mobileMenu: $('#mobile-menu'),
    urlInput: $('#url-input'),
    btnPaste: $('#btn-paste'),
    videoPreview: $('#video-preview'),
    previewThumb: $('#preview-thumb'),
    previewTitle: $('#preview-title'),
    previewChannel: $('#preview-channel'),
    previewDuration: $('#preview-duration'),
    btnDownload: $('#btn-download'),
    qualityGrid: $('#quality-grid'),
    trimToggle: $('#trim-toggle'),
    trimInputs: $('#trim-inputs'),
    timeStart: $('#time-start'),
    timeEnd: $('#time-end'),
    progressSection: $('#progress-section'),
    progressFill: $('#progress-fill'),
    progressStatus: $('#progress-status'),
    progressPercent: $('#progress-percent'),
    successMessage: $('#success-message'),
    successTitle: $('#success-title'),
    successDesc: $('#success-desc'),
    btnResetDownload: $('#btn-reset-download'),
    btnCopyCode: $('#btn-copy-code'),
};

// ============================
// Navbar Scroll Effect
// ============================
function initNavbar() {
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Active link tracking
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(section => observer.observe(section));
}

// ============================
// Mobile Menu
// ============================
function initMobileMenu() {
    elements.navToggle.addEventListener('click', () => {
        elements.navToggle.classList.toggle('active');
        elements.mobileMenu.classList.toggle('active');
        document.body.style.overflow = elements.mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    $$('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            elements.navToggle.classList.remove('active');
            elements.mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ============================
// Scroll Animations (Fade In)
// ============================
function initScrollAnimations() {
    const fadeElements = $$('.fade-in');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => observer.observe(el));
}

// ============================
// Counter Animation (Stats)
// ============================
function initCounters() {
    const counters = $$('.stat-number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count);
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4); // ease-out quart
        const current = Math.round(startValue + (target - startValue) * eased);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================
// Quality Selection
// ============================
function initQualitySelection() {
    const options = $$('.quality-option');

    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            option.querySelector('input').checked = true;
        });
    });
}

// ============================
// Trim Toggle
// ============================
function initTrimToggle() {
    elements.trimToggle.addEventListener('change', () => {
        if (elements.trimToggle.checked) {
            elements.trimInputs.classList.remove('hidden');
            elements.trimInputs.style.animation = 'slide-down 0.3s ease-out';
        } else {
            elements.trimInputs.classList.add('hidden');
        }
    });
}

// ============================
// Paste Button
// ============================
function initPasteButton() {
    elements.btnPaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            elements.urlInput.value = text;
            elements.urlInput.focus();
            showToast('📋 URL pegada correctamente', 'success');
            checkAndFetchVideoInfo(text.trim());
        } catch (err) {
            showToast('⚠️ No se pudo acceder al portapapeles', 'error');
        }
    });
}

// ============================
// URL Validation
// ============================
function isValidYouTubeURL(url) {
    const patterns = [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
}

// ============================
// Video Info Preview
// ============================
let infoDebounceTimer = null;

function initUrlInputWatcher() {
    elements.urlInput.addEventListener('input', () => {
        clearTimeout(infoDebounceTimer);
        const url = elements.urlInput.value.trim();
        if (!url) {
            hideVideoPreview();
            return;
        }

        infoDebounceTimer = setTimeout(() => {
            checkAndFetchVideoInfo(url);
        }, 500);
    });
}

async function checkAndFetchVideoInfo(url) {
    if (!isValidYouTubeURL(url)) {
        hideVideoPreview();
        return;
    }

    // Show loading preview state
    if (elements.videoPreview) {
        elements.videoPreview.classList.remove('hidden');
        elements.previewTitle.textContent = 'Buscando video en YouTube...';
        elements.previewChannel.textContent = 'Cargando información...';
        elements.previewDuration.textContent = '--:--';
        elements.previewThumb.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="80" fill="%2316161f"/>';
    }

    try {
        const response = await fetch('/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        if (!response.ok) {
            hideVideoPreview();
            return;
        }

        const data = await response.json();
        if (data.title && elements.videoPreview) {
            elements.videoPreview.classList.remove('hidden');
            elements.previewTitle.textContent = data.title;
            elements.previewChannel.textContent = `📺 ${data.channel || 'YouTube'}`;
            elements.previewDuration.textContent = data.duration || '0:00';
            if (data.thumbnail) {
                elements.previewThumb.src = data.thumbnail;
            }
        }
    } catch (err) {
        console.warn('Error fetching video info:', err);
    }
}

function hideVideoPreview() {
    if (elements.videoPreview) {
        elements.videoPreview.classList.add('hidden');
    }
}

// ============================
// Real Download Execution
// ============================
let activePollingInterval = null;

function initDownload() {
    elements.btnDownload.addEventListener('click', async () => {
        const url = elements.urlInput.value.trim();

        if (!url) {
            showToast('⚠️ Por favor, pega una URL de YouTube', 'error');
            elements.urlInput.focus();
            shakeElement(elements.urlInput.closest('.input-wrapper'));
            return;
        }

        if (!isValidYouTubeURL(url)) {
            showToast('❌ URL no válida. Ingresa un enlace correcto de YouTube', 'error');
            shakeElement(elements.urlInput.closest('.input-wrapper'));
            return;
        }

        // Get selected quality
        const selectedQuality = $('input[name="quality"]:checked')?.value || 'best';

        // Trim settings
        const trimData = {
            enabled: elements.trimToggle.checked,
            start: elements.timeStart ? elements.timeStart.value.trim() : '',
            end: elements.timeEnd ? elements.timeEnd.value.trim() : '',
        };

        if (trimData.enabled && (!trimData.start || !trimData.end)) {
            showToast('⚠️ Ingresa los tiempos de inicio y fin para recortar', 'error');
            return;
        }

        // Prepare UI
        elements.btnDownload.classList.add('hidden');
        elements.successMessage.classList.add('hidden');
        elements.progressSection.classList.remove('hidden');
        elements.progressFill.style.width = '5%';
        elements.progressPercent.textContent = '5%';
        elements.progressStatus.textContent = 'Conectando con el servidor...';

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: url,
                    quality: selectedQuality,
                    trim: trimData,
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Error al iniciar la descarga');
            }

            const jobId = data.job_id;
            pollDownloadProgress(jobId);

        } catch (error) {
            console.error('Download error:', error);
            showToast(`❌ ${error.message}`, 'error');
            resetDownloadUI();
        }
    });
}

function pollDownloadProgress(jobId) {
    if (activePollingInterval) {
        clearInterval(activePollingInterval);
    }

    activePollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/progress/${jobId}`);
            if (!res.ok) {
                throw new Error('Error al consultar el progreso');
            }

            const progress = await res.json();

            if (progress.status === 'error') {
                clearInterval(activePollingInterval);
                activePollingInterval = null;
                showToast(`❌ Error: ${progress.error || progress.status_text}`, 'error');
                resetDownloadUI();
                return;
            }

            // Update UI with real percentage and details
            const percent = Math.min(Math.max(progress.percent || 0, 5), 100);
            elements.progressFill.style.width = `${percent}%`;
            elements.progressPercent.textContent = `${Math.round(percent)}%`;
            elements.progressStatus.textContent = progress.status_text || 'Procesando descarga...';

            if (progress.download_ready || progress.status === 'completed') {
                clearInterval(activePollingInterval);
                activePollingInterval = null;

                elements.progressFill.style.width = '100%';
                elements.progressPercent.textContent = '100%';
                elements.progressStatus.textContent = '¡Archivo listo! Iniciando transferencia al navegador...';

                // Trigger browser file download
                setTimeout(() => {
                    triggerBrowserDownload(jobId, progress.filename);

                    // Show success section
                    elements.progressSection.classList.add('hidden');
                    elements.successMessage.classList.remove('hidden');
                    elements.successMessage.classList.add('bounce-in');
                    if (elements.successDesc) {
                        elements.successDesc.textContent = `"${progress.filename}" se ha descargado a tu carpeta de Descargas.`;
                    }
                    showToast('🎉 ¡Descarga guardada en tu equipo!', 'success');
                }, 600);
            }

        } catch (err) {
            console.error('Polling error:', err);
        }
    }, 600);
}

function triggerBrowserDownload(jobId, filename) {
    const downloadUrl = `/api/file/${jobId}`;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = downloadUrl;
    if (filename) {
        a.download = filename;
    }
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        a.remove();
    }, 1000);
}

function resetDownloadUI() {
    if (activePollingInterval) {
        clearInterval(activePollingInterval);
        activePollingInterval = null;
    }
    elements.progressSection.classList.add('hidden');
    elements.successMessage.classList.add('hidden');
    elements.btnDownload.classList.remove('hidden');
    elements.progressFill.style.width = '0%';
    elements.progressPercent.textContent = '0%';
}

// ============================
// Reset Button for Another Download
// ============================
function initResetButton() {
    if (elements.btnResetDownload) {
        elements.btnResetDownload.addEventListener('click', () => {
            resetDownloadUI();
            elements.urlInput.value = '';
            hideVideoPreview();
            elements.urlInput.focus();
        });
    }
}

// ============================
// Shake Animation
// ============================
function shakeElement(element) {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = 'shake 0.4s ease-out';

    // Add shake keyframes dynamically
    if (!document.querySelector('#shake-style')) {
        const style = document.createElement('style');
        style.id = 'shake-style';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20% { transform: translateX(-8px); }
                40% { transform: translateX(8px); }
                60% { transform: translateX(-4px); }
                80% { transform: translateX(4px); }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        element.style.animation = '';
    }, 400);
}

// ============================
// Toast Notifications
// ============================
function showToast(message, type = 'success') {
    // Remove any existing toast
    const existing = $('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================
// Copy Code Button
// ============================
function initCopyCode() {
    if (elements.btnCopyCode) {
        elements.btnCopyCode.addEventListener('click', async () => {
            const codeBlock = $('.code-body code');
            if (!codeBlock) return;

            try {
                await navigator.clipboard.writeText(codeBlock.innerText);
                showToast('📋 Código copiado al portapapeles', 'success');

                const originalHTML = elements.btnCopyCode.innerHTML;
                elements.btnCopyCode.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                `;

                setTimeout(() => {
                    elements.btnCopyCode.innerHTML = originalHTML;
                }, 2000);
            } catch (err) {
                showToast('⚠️ No se pudo copiar el código', 'error');
            }
        });
    }
}

// ============================
// Mouse Glow Effect on Cards
// ============================
function initGlowEffect() {
    const cards = $$('.feature-card, .downloader-card, .step-card, .faq-item');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// ============================
// Smooth Scroll for Nav Links
// ============================
function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = $(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================
// Keyboard Shortcuts
// ============================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Enter to download when input is focused
        if (e.key === 'Enter' && document.activeElement === elements.urlInput) {
            elements.btnDownload.click();
        }

        // Escape to close mobile menu
        if (e.key === 'Escape' && elements.mobileMenu.classList.contains('active')) {
            elements.navToggle.classList.remove('active');
            elements.mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ============================
// Initialize Everything
// ============================
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initScrollAnimations();
    initCounters();
    initQualitySelection();
    initTrimToggle();
    initPasteButton();
    initUrlInputWatcher();
    initDownload();
    initResetButton();
    initCopyCode();
    initGlowEffect();
    initSmoothScroll();
    initKeyboardShortcuts();

    console.log('🚀 YT Downloader PRO iniciado con servidor real');
});
