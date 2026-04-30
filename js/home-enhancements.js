// ==========================================
// HOME PAGE ENHANCEMENTS - 2025 Edition
// Advanced features for the homepage
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- Performance & Feature Detection ---
    const supportsIntersectionObserver = 'IntersectionObserver' in window;
    const supportsRequestIdleCallback = 'requestIdleCallback' in window;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Lazy Loading for Images ---
    if (supportsIntersectionObserver) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy-loading');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // --- Advanced Scroll Effects ---
    if (!prefersReducedMotion) {
        let scrollY = 0;
        let ticking = false;

        const parallaxElements = document.querySelectorAll('.parallax-element');
        const heroElements = document.querySelectorAll('.hero-fade-in');
        const hasScrollEffects = parallaxElements.length > 0 || heroElements.length > 0;

        const updateScrollEffects = () => {
            if (!hasScrollEffects) { ticking = false; return; }
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach(element => {
                element.style.transform = `translate3d(0, ${rate * 0.5}px, 0)`;
            });

            heroElements.forEach(element => {
                const opacity = Math.max(0, 1 - scrolled / 600);
                element.style.opacity = opacity;
            });

            ticking = false;
        };

        if (hasScrollEffects) {
            window.addEventListener('scroll', () => {
                scrollY = window.pageYOffset;
                if (!ticking) {
                    (supportsRequestIdleCallback ? requestIdleCallback : requestAnimationFrame)(updateScrollEffects);
                    ticking = true;
                }
            });
        }
    }

    // --- Enhanced Phone Mockup Interactions ---
    // DISABLED: premium.js already runs phone parallax. Duplicate rAF loop caused lag (H1).

    // --- Progressive Web App Features ---
    // Service Worker registration for offline capability
    if ('serviceWorker' in navigator && (window.isSecureContext || location.hostname === 'localhost')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // --- Advanced Form Validation ---
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', (e) => {
            const email = e.target.value;
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

            input.setAttribute('aria-invalid', !isValid);
            if (!isValid && email) {
                input.setAttribute('aria-describedby', 'email-error');
            } else {
                input.removeAttribute('aria-describedby');
            }
        });
    });

    // --- Advanced Keyboard Navigation ---
    document.addEventListener('keydown', (e) => {
        // Skip to main content with Ctrl/Cmd + Home
        if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
            e.preventDefault();
            document.querySelector('#main-content')?.focus();
        }

        // Focus trap for mobile menu
        const mobileMenu = document.querySelector('.nav-links.open');
        if (mobileMenu && e.key === 'Tab') {
            const focusableElements = mobileMenu.querySelectorAll('a[href], button, input, select, textarea');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

    // --- Performance Monitoring ---
    if ('PerformanceObserver' in window) {
        // Monitor Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log('FID:', entry.processingStart - entry.startTime);
            }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
    }

    // --- Error Handling ---
    window.addEventListener('error', (e) => {
        console.error('JavaScript Error:', e.error);
        // Send error to analytics service
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled Promise Rejection:', e.reason);
        // Send error to analytics service
    });
});


