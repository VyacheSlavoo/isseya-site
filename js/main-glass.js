// ==========================================
// ИССЕЯ - ULTRA INTERACTIVE CORE (2025)
// Physics-based animations & 3D effects
// Enhanced with accessibility and performance
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- 0. Performance & Accessibility Setup ---
    // Remove no-js class for progressive enhancement
    document.documentElement.classList.remove('no-js');

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 1. Init Core & AOS ---
    if (typeof AOS !== 'undefined' && !prefersReducedMotion) {
        AOS.init({
            duration: 800,
            easing: 'ease-out-quart',
            once: true,
            disable: 'mobile' // Disable on mobile for better performance
        });
    }

    // --- 1.5 Mobile Navigation ---
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-links');

    if (mobileMenuToggle && navMenu) {
        if (mobileMenuToggle.dataset.menuInitialized === 'true') {
            return;
        }
        mobileMenuToggle.dataset.menuInitialized = 'true';

        mobileMenuToggle.addEventListener('click', () => {
            const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
            mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('open');

            // Prevent body scroll when menu is open
            document.body.style.overflow = isExpanded ? 'auto' : 'hidden';
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('open');
                document.body.style.overflow = 'auto';
                mobileMenuToggle.focus();
            }
        });
    }

    // --- 1.6 Sticky Navigation with Performance ---
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavbar = () => {
        const navbar = document.querySelector('.premium-nav');
        const scrollY = window.scrollY;

        if (navbar) {
            if (scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    });

    // --- 2. Magnetic Buttons Effect ---
    const magneticBtns = document.querySelectorAll('.btn-glass');
    
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Magnetic pull strength
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0) scale(1)';
        });
    });

    // --- 3. 3D Tilt Effect for Cards ---
    const cards = document.querySelectorAll('.feature-card-glass, .pricing-card-glass');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate rotation based on center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;

            // Apply transform
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            // Dynamic Glow position
            const glow = card.querySelector('.feature-glow');
            if(glow) {
                glow.style.transform = `translate(${x - 150}px, ${y - 150}px)`;
                glow.style.opacity = '0.4';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            const glow = card.querySelector('.feature-glow');
            if(glow) glow.style.opacity = '0';
        });
    });

    // --- 4. Phone Mockup Parallax (Mouse Tracking) ---
    const phoneMockup = document.querySelector('.phone-mockup-glass');
    if (phoneMockup) {
        document.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.clientX) / 50;
            const y = (window.innerHeight / 2 - e.clientY) / 50;
            
            // Smooth lerp could be added here for production
            phoneMockup.style.transform = `rotateY(${-10 + x * 0.5}deg) rotateX(${5 + y * 0.5}deg)`;
        });
    }

    // --- 6. Stats Counter Animation ---
    const counters = document.querySelectorAll('.trust-text strong');
    const animateCounter = (el) => {
        const target = parseFloat(el.innerText.replace(/,/g, '').replace('+', ''));
        const isFloat = el.innerText.includes('.');
        const suffix = el.innerText.includes('+') ? '+' : '';
        
        let current = 0;
        const inc = target / 50; // Speed
        
        const update = () => {
            current += inc;
            if (current < target) {
                el.innerText = isFloat ? current.toFixed(1) + suffix : Math.ceil(current) + suffix;
                requestAnimationFrame(update);
            } else {
                el.innerText = target + suffix;
            }
        };
        update();
    };

    // Intersection Observer for counters
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(c => observer.observe(c));

    console.log('✨ Иссея: Инновационный режим активирован');
});
