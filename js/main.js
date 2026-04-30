// ==========================================
// PSYCHEA - Main JavaScript
// Modern, Interactive, Performance-Optimized
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    const utils = {
        // Debounce function for performance
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Check if element is in viewport
        isInViewport: function(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },

        // Smooth scroll to element
        smoothScroll: function(target, duration = 1000) {
            const targetElement = document.querySelector(target);
            if (!targetElement) return;

            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const run = ease(timeElapsed, startPosition, distance, duration);
                window.scrollTo(0, run);
                if (timeElapsed < duration) requestAnimationFrame(animation);
            }

            function ease(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            }

            requestAnimationFrame(animation);
        }
    };

    // ==========================================
    // NAVIGATION
    // ==========================================

    const Navigation = {
        init: function() {
            this.navbar = document.getElementById('navbar');
            this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
            this.navMenu = document.getElementById('navMenu');
            this.navLinks = document.querySelectorAll('.nav-link');

            this.setupScrollEffect();
            this.setupMobileMenu();
            this.setupSmoothScroll();
            this.highlightActiveSection();
        },

        setupScrollEffect: function() {
            window.addEventListener('scroll', utils.debounce(() => {
                if (window.scrollY > 50) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
            }, 10));
        },

        setupMobileMenu: function() {
            if (!this.mobileMenuBtn) return;

            this.mobileMenuBtn.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                this.mobileMenuBtn.classList.toggle('active');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.navMenu.contains(e.target) && 
                    !this.mobileMenuBtn.contains(e.target) &&
                    this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                    this.mobileMenuBtn.classList.remove('active');
                }
            });

            // Close menu when clicking on a link
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.navMenu.classList.remove('active');
                    this.mobileMenuBtn.classList.remove('active');
                });
            });
        },

        setupSmoothScroll: function() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    const href = this.getAttribute('href');
                    if (href === '#' || !document.querySelector(href)) return;
                    
                    e.preventDefault();
                    utils.smoothScroll(href, 1000);
                });
            });
        },

        highlightActiveSection: function() {
            const sections = document.querySelectorAll('section[id]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${entry.target.id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, {
                threshold: 0.5
            });

            sections.forEach(section => observer.observe(section));
        }
    };

    // ==========================================
    // BACK TO TOP BUTTON
    // ==========================================

    const BackToTop = {
        init: function() {
            this.button = document.getElementById('backToTop');
            if (!this.button) return;

            this.setupButton();
        },

        setupButton: function() {
            // Show/hide button based on scroll position
            window.addEventListener('scroll', utils.debounce(() => {
                if (window.scrollY > 300) {
                    this.button.classList.add('visible');
                } else {
                    this.button.classList.remove('visible');
                }
            }, 100));

            // Scroll to top on click
            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    };

    // ==========================================
    // ANIMATED COUNTERS
    // ==========================================

    const AnimatedCounters = {
        init: function() {
            this.counters = document.querySelectorAll('.stat-value[data-target]');
            if (this.counters.length === 0) return;

            this.setupCounters();
        },

        setupCounters: function() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.5
            });

            this.counters.forEach(counter => observer.observe(counter));
        },

        animateCounter: function(element) {
            const target = parseInt(element.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    element.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = target;
                }
            };

            requestAnimationFrame(updateCounter);
        }
    };

    // ==========================================
    // ANIMATIONS ON SCROLL (AOS) INITIALIZATION
    // ==========================================

    const AnimationsOnScroll = {
        init: function() {
            // Check if AOS is loaded
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,
                    easing: 'ease-out-cubic',
                    once: true,
                    offset: 100,
                    delay: 50,
                    disable: function() {
                        return window.innerWidth < 768; // Disable on mobile for better performance
                    }
                });
            } else {
                // Fallback if AOS is not loaded
                this.setupFallbackAnimations();
            }
        },

        setupFallbackAnimations: function() {
            const elements = document.querySelectorAll('[data-aos]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });

            elements.forEach(element => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(element);
            });
        }
    };

    // ==========================================
    // HERO PHONE MOCKUP INTERACTION
    // ==========================================

    const PhoneMockup = {
        init: function() {
            this.mockup = document.querySelector('.phone-mockup');
            if (!this.mockup) return;

            this.setup3DEffect();
        },

        setup3DEffect: function() {
            const frame = this.mockup.querySelector('.phone-frame');
            
            this.mockup.addEventListener('mousemove', (e) => {
                const rect = this.mockup.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = ((y - centerY) / centerY) * 10;
                const rotateY = ((centerX - x) / centerX) * 10;
                
                frame.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            });
            
            this.mockup.addEventListener('mouseleave', () => {
                frame.style.transform = 'rotateY(-15deg) rotateX(5deg)';
            });
        }
    };

    // ==========================================
    // MOOD SELECTOR INTERACTION
    // ==========================================

    const MoodSelector = {
        init: function() {
            this.moodButtons = document.querySelectorAll('.mood-btn');
            if (this.moodButtons.length === 0) return;

            this.setupMoodButtons();
        },

        setupMoodButtons: function() {
            this.moodButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    this.moodButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    button.classList.add('active');
                    
                    // Add animation
                    button.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 200);
                });
            });
        }
    };

    // ==========================================
    // FORM VALIDATION (for contact form)
    // ==========================================

    const FormValidation = {
        init: function() {
            this.forms = document.querySelectorAll('form[data-validate]');
            if (this.forms.length === 0) return;

            this.setupValidation();
        },

        setupValidation: function() {
            this.forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (this.validateForm(form)) {
                        this.submitForm(form);
                    }
                });

                // Real-time validation
                const inputs = form.querySelectorAll('input, textarea');
                inputs.forEach(input => {
                    input.addEventListener('blur', () => {
                        this.validateField(input);
                    });
                });
            });
        },

        validateForm: function(form) {
            let isValid = true;
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            
            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            return isValid;
        },

        validateField: function(field) {
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            // Check if field is required and empty
            if (field.hasAttribute('required') && value === '') {
                isValid = false;
                errorMessage = 'Это поле обязательно для заполнения';
            }

            // Email validation
            if (field.type === 'email' && value !== '') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Введите корректный email';
                }
            }

            // Phone validation
            if (field.type === 'tel' && value !== '') {
                const phoneRegex = /^[\d\s\-\+\(\)]+$/;
                if (!phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Введите корректный номер телефона';
                }
            }

            // Show/hide error
            this.toggleError(field, isValid, errorMessage);

            return isValid;
        },

        toggleError: function(field, isValid, message) {
            let errorElement = field.parentElement.querySelector('.error-message');

            if (!isValid) {
                field.classList.add('error');
                if (!errorElement) {
                    errorElement = document.createElement('span');
                    errorElement.className = 'error-message';
                    field.parentElement.appendChild(errorElement);
                }
                errorElement.textContent = message;
            } else {
                field.classList.remove('error');
                if (errorElement) {
                    errorElement.remove();
                }
            }
        },

        submitForm: function(form) {
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            // Show loading state
            submitButton.textContent = 'Отправка...';
            submitButton.disabled = true;

            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                // Success
                submitButton.textContent = 'Отправлено!';
                submitButton.style.background = '#10b981';
                
                setTimeout(() => {
                    form.reset();
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                    submitButton.style.background = '';
                }, 2000);

                // Show success message
                this.showMessage('Спасибо! Ваше сообщение отправлено.', 'success');
            }, 1500);
        },

        showMessage: function(message, type) {
            const messageElement = document.createElement('div');
            messageElement.className = `form-message ${type}`;
            messageElement.textContent = message;
            messageElement.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 1rem 1.5rem;
                background: ${type === 'success' ? '#10b981' : '#ef4444'};
                color: white;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px rgba(0,0,0,0.1);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            `;

            document.body.appendChild(messageElement);

            setTimeout(() => {
                messageElement.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => messageElement.remove(), 300);
            }, 3000);
        }
    };

    // ==========================================
    // LAZY LOADING IMAGES
    // ==========================================

    const LazyLoad = {
        init: function() {
            this.images = document.querySelectorAll('img[data-src]');
            if (this.images.length === 0) return;

            this.setupLazyLoading();
        },

        setupLazyLoading: function() {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            this.images.forEach(img => imageObserver.observe(img));
        }
    };

    // ==========================================
    // PERFORMANCE MONITORING
    // ==========================================

    const Performance = {
        init: function() {
            // Log page load time
            window.addEventListener('load', () => {
                const loadTime = performance.now();
                console.log(`Page loaded in ${Math.round(loadTime)}ms`);
            });

            // Monitor long tasks (for debugging)
            if (typeof PerformanceObserver !== 'undefined') {
                try {
                    const observer = new PerformanceObserver((list) => {
                        list.getEntries().forEach((entry) => {
                            if (entry.duration > 50) {
                                console.warn('Long task detected:', entry.duration, 'ms');
                            }
                        });
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    // PerformanceObserver might not be supported
                }
            }
        }
    };

    // ==========================================
    // INITIALIZE ALL MODULES
    // ==========================================

    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeModules);
        } else {
            initializeModules();
        }
    }

    function initializeModules() {
        console.log('🧠 Psychea website initialized');

        // Initialize all modules
        Navigation.init();
        BackToTop.init();
        AnimatedCounters.init();
        AnimationsOnScroll.init();
        PhoneMockup.init();
        MoodSelector.init();
        FormValidation.init();
        LazyLoad.init();
        Performance.init();

        // Add loaded class to body
        document.body.classList.add('loaded');
    }

    // Start initialization
    init();

    // ==========================================
    // EXPOSE PUBLIC API (if needed)
    // ==========================================

    window.PsycheaApp = {
        version: '1.0.0',
        utils: utils,
        refresh: initializeModules
    };

})();

// ==========================================
// ADDITIONAL CSS ANIMATIONS (Inject dynamically)
// ==========================================

(function injectAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        .error-message {
            display: block;
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }

        input.error,
        textarea.error {
            border-color: #ef4444 !important;
        }
    `;
    document.head.appendChild(style);
})();

// ==========================================
// SERVICE WORKER REGISTRATION (Optional - for PWA)
// ==========================================

if ('serviceWorker' in navigator && (window.isSecureContext || location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' }).then(
            registration => {
                console.log('ServiceWorker registered:', registration.scope);
            },
            error => {
                console.log('ServiceWorker registration failed:', error);
            }
        );
    });
}



