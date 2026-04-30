// ==========================================
// ИССЕЯ - PREMIUM INTERACTIVE CORE
// Commercial-grade, performant, smooth
// ==========================================

(function() {
    'use strict';

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function ensureBrandLogos() {
        const logoLinks = document.querySelectorAll('.logo-premium');
        if (logoLinks.length === 0) return;

        const inPagesDir = window.location.pathname.includes('/pages/');
        const logoSrc = inPagesDir ? '../лого.svg' : 'лого.svg';

        logoLinks.forEach(link => {
            if (link.querySelector('img')) return;

            link.classList.add('logo-premium--image');
            link.innerHTML = `<img src="${logoSrc}" class="logo-mark" alt="Логотип Иссея" loading="eager" decoding="async">`;
        });
    }

    function initScrollProgress() {
        const main = document.querySelector('main');
        if (!main) return;

        const bar = document.createElement('div');
        bar.className = 'scroll-progress-premium';
        document.body.appendChild(bar);

        const updateProgress = () => {
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop;
            const scrollHeight = doc.scrollHeight - doc.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            bar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        };

        let scrollRaf = null;
        const throttledUpdate = () => {
            if (!scrollRaf) {
                scrollRaf = requestAnimationFrame(() => {
                    updateProgress();
                    scrollRaf = null;
                });
            }
        };
        window.addEventListener('scroll', throttledUpdate, { passive: true });
        updateProgress();
    }

    function initLazyImages() {
        const images = document.querySelectorAll('img');
        images.forEach((img, idx) => {
            if (!img.hasAttribute('loading')) {
                // Keep first meaningful hero/brand image eager for fast visual stability.
                img.setAttribute('loading', idx < 2 ? 'eager' : 'lazy');
            }
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });
    }

    function initRippleInteraction() {
        const rippleTargets = document.querySelectorAll('.btn-premium, .blog-read-more');
        rippleTargets.forEach(target => {
            target.classList.add('ripple-host');
            target.addEventListener('click', (event) => {
                const rect = target.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size = Math.max(rect.width, rect.height);
                ripple.className = 'ripple-circle';
                ripple.style.width = `${size}px`;
                ripple.style.height = `${size}px`;
                ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
                target.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
            });
        });
    }

    function initSectionReveal() {
        if (prefersReducedMotion()) return;

        const sections = document.querySelectorAll('.section-premium');
        if (sections.length === 0 || !('IntersectionObserver' in window)) return;

        sections.forEach(section => section.classList.add('section-reveal'));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });

        sections.forEach(section => observer.observe(section));
    }

    function initMobileMenu() {
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        if (!navLinks.id) {
            navLinks.id = 'nav-menu';
        }

        let menuButton = document.querySelector('.mobile-menu-toggle');
        if (!menuButton) {
            menuButton = document.createElement('button');
            menuButton.className = 'mobile-menu-toggle';
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-controls', navLinks.id);
            menuButton.setAttribute('aria-label', 'Открыть меню');
            menuButton.innerHTML = `
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
                <span class="hamburger-line"></span>
            `;
            const navContainer = navLinks.closest('.nav-container');
            if (navContainer) {
                navContainer.insertBefore(menuButton, navLinks);
            }
        }

        if (menuButton.dataset.menuInitialized === 'true') return;
        menuButton.dataset.menuInitialized = 'true';

        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        document.body.appendChild(overlay);

        const setOpen = (isOpen) => {
            menuButton.setAttribute('aria-expanded', String(isOpen));
            navLinks.classList.toggle('open', isOpen);
            overlay.classList.toggle('visible', isOpen);
            document.body.classList.toggle('menu-open', isOpen);
        };

        menuButton.addEventListener('click', () => {
            const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
            setOpen(!isOpen);
        });

        overlay.addEventListener('click', () => setOpen(false));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setOpen(false);
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setOpen(false));
        });
    }

    function initMobileStickyCta() {
        const path = window.location.pathname;
        const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/website/');
        if (!isHome) return;

        const downloadSection = document.getElementById('download');
        const pricingSection = document.getElementById('pricing');
        if (!downloadSection && !pricingSection) return;

        const sticky = document.createElement('div');
        sticky.className = 'mobile-sticky-cta-premium';
        sticky.innerHTML = `
            <a href="pages/contact.html?subject=beta" class="mobile-sticky-cta-btn mobile-sticky-cta-btn--primary" data-cta-name="sticky_beta">
                <i class="fas fa-flask" aria-hidden="true"></i>
                <span>Записаться на тест</span>
            </a>
            <a href="#pricing" class="mobile-sticky-cta-btn mobile-sticky-cta-btn--ghost" data-cta-name="sticky_pricing" aria-label="Тарифы">
                <i class="fas fa-tag" aria-hidden="true"></i>
            </a>
        `;
        document.body.appendChild(sticky);
        document.body.classList.add('has-mobile-sticky-cta');

        const updateOffset = () => {
            const cookieBannerVisible = !!document.getElementById('cookieConsent');
            sticky.classList.toggle('mobile-sticky-cta--raised', cookieBannerVisible);
        };

        const observer = new MutationObserver(updateOffset);
        observer.observe(document.body, { childList: true, subtree: false });
        updateOffset();
    }

    // Show elements that are in viewport immediately (above the fold)
    function showVisibleElements() {
        const aosElements = document.querySelectorAll('[data-aos]');
        const viewportHeight = window.innerHeight;
        
        aosElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            // If element is in viewport, show immediately
            if (rect.top < viewportHeight * 1.5 && rect.bottom > -100) {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
                if (rect.top < viewportHeight) {
                    // Element is fully in viewport, show without animation
                    el.style.transform = 'translateY(0)';
                    el.classList.add('aos-animate');
                }
            }
        });
    }

    // Initialize AOS
    function initAOS() {
        // First, show elements that are already visible
        showVisibleElements();
        
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'ease-out-quart',
            once: true,
            offset: 100,
                delay: 50,
                disable: false // Ensure AOS is enabled
            });
            
            // Refresh AOS after initialization
            setTimeout(() => {
                AOS.refresh();
                showVisibleElements(); // Show visible elements again
            }, 100);
            
            // Fallback: ensure all elements are visible after 2 seconds
            setTimeout(() => {
                const aosElements = document.querySelectorAll('[data-aos]');
                aosElements.forEach(el => {
                    const computedStyle = window.getComputedStyle(el);
                    const isHidden = computedStyle.opacity === '0' || 
                                   computedStyle.visibility === 'hidden';
                    
                    if (isHidden || !el.classList.contains('aos-animate')) {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.style.visibility = 'visible';
                        el.classList.add('aos-animate');
                    }
                });
            }, 2000);
        } else {
            // If AOS is not loaded, show all elements immediately
            const aosElements = document.querySelectorAll('[data-aos]');
            aosElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.style.visibility = 'visible';
            });
        }
    }
    
    // Wait for DOM and AOS library to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initAOS, 50);
        });
    } else {
        setTimeout(initAOS, 50);
    }
    
    // Also check on window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            showVisibleElements();
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }, 100);
    });

    ensureBrandLogos();
    initScrollProgress();
    initLazyImages();
    initRippleInteraction();
    initSectionReveal();
    initMobileMenu();
    initMobileStickyCta();

    // ==========================================
    // NAVIGATION
    // ==========================================
    const navbar = document.getElementById('navbar');
    
    if (navbar) {
        let navRaf = null;
        window.addEventListener('scroll', () => {
            if (!navRaf) {
                navRaf = requestAnimationFrame(() => {
                    navbar.classList.toggle('scrolled', window.scrollY > 50);
                    navRaf = null;
                });
            }
        }, { passive: true });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || !document.querySelector(href)) return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            const offsetTop = target.offsetTop - 100;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        });
    });

    // ==========================================
    // MAGNETIC BUTTONS (OPTIMIZED - CTA ONLY)
    // ==========================================
    const magneticButtons = document.querySelectorAll('.nav-cta'); // Only main CTA
    
    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            // Reduced movement for subtler effect
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // ==========================================
    // 3D TILT EFFECT FOR CARDS (DISABLED FOR TRENDY LOOK)
    // ==========================================
    /*
    const cards = document.querySelectorAll('.card-premium, .feature-card-premium, .pricing-card-premium');
    
    cards.forEach(card => {
        // ... previous tilt code ...
    });
    */

    // ==========================================
    // PHONE MOCKUP PARALLAX
    // ==========================================
    const phoneMockup = document.querySelector('.phone-mockup-premium');
    if (phoneMockup) {
        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = (window.innerWidth / 2 - e.clientX) / 50;
            mouseY = (window.innerHeight / 2 - e.clientY) / 50;
        });

        function animate() {
            const frame = phoneMockup.querySelector('.phone-frame');
            if (!frame) return;
            currentX += (mouseX - currentX) * 0.1;
            currentY += (mouseY - currentY) * 0.1;

            frame.style.transform =
                `rotateY(${-12 + currentX * 0.5}deg) rotateX(${5 + currentY * 0.5}deg)`;

            requestAnimationFrame(animate);
        }
        animate();
    }

    // ==========================================
    // MOOD SELECTOR INTERACTION
    // ==========================================
    const moodButtons = document.querySelectorAll('.mood-btn-ui');
    moodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            moodButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });

    // ==========================================
    // ANIMATED COUNTERS
    // ==========================================
    const counters = document.querySelectorAll('.stat-value, .stat-number-premium');
    
    const animateCounter = (el) => {
        const text = (el.textContent || '').trim();

        // Some stat values are "formatting counters" like "3–5" or "24/7".
        // The generic number/suffix parser turns them into "35–" and "247/".
        // Keep those values intact instead of animating them.
        const isRange = /^(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)$/.test(text);
        const isFraction = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.test(text);
        if (isRange || isFraction) return;

        const target = parseFloat(text.replace(/[^\d.]/g, ''));
        const suffix = text.replace(/[\d.]/g, '');
        const isFloat = text.includes('.');

        // #region agent log
        if ((/[\/\-–—]/.test(text)) && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            fetch('http://127.0.0.1:7802/ingest/7d94d518-ef1c-4cea-bc93-0e5bfb95a4a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'78ce86'},body:JSON.stringify({sessionId:'78ce86',runId:'home-counter-pre',hypothesisId:'A',location:'premium.js:animateCounter',message:'Counter parse inputs',data:{original:text,target,suffix,isFloat},timestamp:Date.now()})}).catch(()=>{});
        }
        // #endregion
        
        let current = 0;
        const increment = target / 60;
        
        const update = () => {
            current += increment;
            if (current < target) {
                el.textContent = (isFloat ? current.toFixed(1) : Math.ceil(current)) + suffix;
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
                // #region agent log
                if ((/[\/\-–—]/.test(text)) && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                    fetch('http://127.0.0.1:7802/ingest/7d94d518-ef1c-4cea-bc93-0e5bfb95a4a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'78ce86'},body:JSON.stringify({sessionId:'78ce86',runId:'home-counter-post',hypothesisId:'C',location:'premium.js:animateCounter',message:'Counter final render',data:{original:text,rendered:el.textContent},timestamp:Date.now()})}).catch(()=>{});
                }
                // #endregion
            }
        };
        update();
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(c => counterObserver.observe(c));

    // ==========================================
    // BACK TO TOP
    // ==========================================
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        let backToTopState = 'hidden';
        let scrollTimeout = null;
        
        // Debounced scroll handler for performance
        const handleScroll = () => {
            const shouldBeVisible = window.scrollY > 300;
            if (shouldBeVisible) {
                if (backToTopState !== 'visible') {
                    backToTop.classList.add('visible');
                    backToTopState = 'visible';
                }
            } else {
                if (backToTopState !== 'hidden') {
                    backToTop.classList.remove('visible');
                    backToTopState = 'hidden';
                }
            }
        };
        
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                cancelAnimationFrame(scrollTimeout);
            }
            scrollTimeout = requestAnimationFrame(handleScroll);
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================
    // PARALLAX ORBS
    // ==========================================
    const orbs = document.querySelectorAll('.orb');
    if (orbs.length > 0) {
        let orbX = 0, orbY = 0;
        let orbRaf = null;
        window.addEventListener('mousemove', (e) => {
            orbX = e.clientX / window.innerWidth;
            orbY = e.clientY / window.innerHeight;
            if (!orbRaf) {
                orbRaf = requestAnimationFrame(() => {
                    const x = orbX, y = orbY;
                    orbs.forEach((orb, index) => {
                        const speed = (index + 1) * 15;
                        const xMove = (x - 0.5) * speed;
                        const yMove = (y - 0.5) * speed;
                        orb.style.transform = `translate(${xMove}px, ${yMove}px)`;
                    });
                    orbRaf = null;
                });
            }
        }, { passive: true });
    }

    // ==========================================
    // PERFORMANCE MONITORING
    // ==========================================
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`✨ Иссея загружена за ${Math.round(loadTime)}ms`);
    });

    // ==========================================
    // SMOOTH REVEAL ON SCROLL (Only if no AOS)
    // ==========================================
    // Don't hide sections if AOS is being used - it conflicts with AOS animations
    if (typeof AOS === 'undefined') {
        const sections = document.querySelectorAll('.section-premium:not([data-aos])');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        sectionObserver.observe(section);
    });
    }

    // ==========================================
    // ТИПОГРАФИКА: ВИСЯЩИЕ ПРЕДЛОГИ
    // Заменяет обычный пробел на неразрывный после
    // коротких предлогов и союзов, чтобы они не
    // оставались в конце строки.
    // ==========================================
    function fixHangingPrepositions() {
        // Предлоги, союзы и частицы длиной 1–3 символа
        const prep = /(\s)(а|в|во|и|из|к|ко|на|не|но|о|об|от|по|под|при|с|со|у|я|до|за|над|или|ли|же|бы|уж|всё|это|то|как|так|нас|нам|вам|вас|без|для|про|через|ведь|вот|тут|там|уже|ещё|их|его|её|им|ей|мне|мы|вы|он|она|они)(\s)/gi;
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    const tag = node.parentElement?.tagName?.toLowerCase();
                    if (['script','style','code','pre','input','textarea','select'].includes(tag)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            // Запускаем несколько раз — предлоги могут стоять подряд
            node.textContent = node.textContent
                .replace(prep, '$1$2\u00a0')
                .replace(prep, '$1$2\u00a0');
        });
    }

    // Запускаем после полной загрузки, чтобы не мешать рендерингу
    if (document.readyState === 'complete') {
        fixHangingPrepositions();
    } else {
        window.addEventListener('load', fixHangingPrepositions, { once: true });
    }

    console.log('🧠 Иссея Premium: Готова помогать! ✨');

})();



