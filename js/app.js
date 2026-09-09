/**
 * YT Downloader PRO — Main Application Logic
 * Handles all UI interactions, animations, and simulated download flow
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
    btnDownload: $('#btn-download'),
    qualityGrid: $('#quality-grid'),
    trimToggle: $('#trim-toggle'),
    trimInputs: $('#trim-inputs'),
    progressSection: $('#progress-section'),
    progressFill: $('#progress-fill'),
    progressStatus: $('#progress-status'),
    progressPercent: $('#progress-percent'),
    successMessage: $('#success-message'),
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
            showToast('✅ URL pegada correctamente', 'success');
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
    ];
    return patterns.some(pattern => pattern.test(url));
}

// ============================
// Download Simulation
// ============================
function initDownload() {
    elements.btnDownload.addEventListener('click', () => {
        const url = elements.urlInput.value.trim();

        if (!url) {
            showToast('⚠️ Por favor, pega una URL de YouTube', 'error');
            elements.urlInput.focus();
            shakeElement(elements.urlInput.closest('.input-wrapper'));
            return;
        }

        if (!isValidYouTubeURL(url)) {
            showToast('❌ URL no válida. Ingresa un enlace de YouTube', 'error');
            shakeElement(elements.urlInput.closest('.input-wrapper'));
            return;
        }

        // Get selected quality
        const selectedQuality = $('input[name="quality"]:checked').value;
        const qualityNames = {
            best: 'Mejor Calidad',
            1080: '1080p Full HD',
            720: '720p HD',
            480: '480p SD',
            mp3: 'Audio MP3',
        };

        // Hide download button, show progress
        elements.btnDownload.classList.add('hidden');
        elements.successMessage.classList.add('hidden');
        elements.progressSection.classList.remove('hidden');

        simulateDownload(qualityNames[selectedQuality] || 'Mejor Calidad');
    });
}

function simulateDownload(qualityName) {
    let progress = 0;
    const messages = [
        { at: 0, text: 'Conectando con YouTube...' },
        { at: 10, text: 'Obteniendo información del video...' },
        { at: 20, text: `Preparando descarga en ${qualityName}...` },
        { at: 30, text: 'Descargando video...' },
        { at: 60, text: 'Descargando audio...' },
        { at: 80, text: 'Combinando streams...' },
        { at: 90, text: 'Finalizando...' },
    ];

    const interval = setInterval(() => {
        progress += Math.random() * 4 + 1;
        if (progress > 100) progress = 100;

        elements.progressFill.style.width = `${progress}%`;
        elements.progressPercent.textContent = `${Math.round(progress)}%`;

        // Update status message
        const currentMessage = [...messages].reverse().find(m => progress >= m.at);
        if (currentMessage) {
            elements.progressStatus.textContent = currentMessage.text;
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                elements.progressSection.classList.add('hidden');
                elements.successMessage.classList.remove('hidden');
                elements.successMessage.classList.add('bounce-in');
                elements.btnDownload.classList.remove('hidden');

                // Reset
                elements.progressFill.style.width = '0%';
                elements.progressPercent.textContent = '0%';

                showToast('✅ ¡Descarga completada exitosamente!', 'success');
            }, 500);
        }
    }, 80);
}

// ============================
// Shake Animation
// ============================
function shakeElement(element) {
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
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================
// Copy Code Button
// ============================
function initCopyCode() {
    elements.btnCopyCode.addEventListener('click', () => {
        const codeText = $('.code-body code').textContent;
        navigator.clipboard.writeText(codeText).then(() => {
            showToast('📋 Código copiado al portapapeles', 'success');
        }).catch(() => {
            showToast('⚠️ No se pudo copiar', 'error');
        });
    });
}

// ============================
// Mouse Glow Effect on Cards
// ============================
function initGlowEffect() {
    const cards = $$('.downloader-card, .feature-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    });
}

// ============================
// Smooth Scroll for Anchor Links
// ============================
function initSmoothScroll() {
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const navHeight = elements.navbar.offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;
                window.scrollTo({
                    top: targetPosition,
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
        // Ctrl+V to focus URL input
        if (e.ctrlKey && e.key === 'v' && document.activeElement !== elements.urlInput) {
            // Don't interfere with normal paste
        }

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
    initDownload();
    initCopyCode();
    initGlowEffect();
    initSmoothScroll();
    initKeyboardShortcuts();

    // Log ready state
    console.log('🚀 YT Downloader PRO initialized');
});
