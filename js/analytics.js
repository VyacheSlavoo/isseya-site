// ==========================================
// ИССЕЯ - ANALYTICS & TRACKING MODULE
// Google Analytics 4 + Yandex Metrika + Cookie Consent
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // COOKIE CONSENT
    // ==========================================
    
    const CookieConsent = {
        cookieName: 'psychoteka_cookie_consent',
        
        init: function() {
            // Check if user has already made a choice
            const consent = this.getConsent();
            
            if (consent === null) {
                // Check if banner was shown recently (prevent flashing)
                const bannerShown = sessionStorage.getItem('cookie_banner_shown');
                if (!bannerShown) {
                    // Small delay to prevent flash
                    setTimeout(() => {
                this.showBanner();
                        sessionStorage.setItem('cookie_banner_shown', 'true');
                    }, 500);
                }
            } else if (consent === 'accepted') {
                // Load saved settings
                const savedSettings = localStorage.getItem('cookie_settings');
                if (savedSettings) {
                    try {
                        const settings = JSON.parse(savedSettings);
                        if (settings.analytics) {
                            this.initAnalytics();
                        }
                    } catch (e) {
                        // If settings corrupted, init analytics anyway
                        this.initAnalytics();
                    }
                } else {
                this.initAnalytics();
                }
            }
        },
        
        getConsent: function() {
            const value = document.cookie
                .split('; ')
                .find(row => row.startsWith(this.cookieName + '='));
            
            if (!value) return null;
            return value.split('=')[1];
        },
        
        setConsent: function(value) {
            // Set cookie for 1 year
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            const secure = location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `${this.cookieName}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;
        },
        
        showBanner: function() {
            // Determine correct path to privacy page
            const currentPath = window.location.pathname;
            const isInPages = currentPath.includes('/pages/');
            const privacyPath = isInPages ? 'privacy.html' : 'pages/privacy.html';
            
            const banner = document.createElement('div');
            banner.id = 'cookieConsent';
            banner.innerHTML = `
                <div class="cookie-consent-overlay"></div>
                <div class="cookie-consent-container">
                    <div class="cookie-consent-content">
                        <div class="cookie-consent-icon">
                            <i class="fas fa-cookie-bite"></i>
                        </div>
                        <div class="cookie-consent-text">
                            <h3>Мы используем cookies 🍪</h3>
                            <p>
                                Мы используем файлы cookie для улучшения работы сайта и аналитики. 
                                Продолжая использовать сайт, вы соглашаетесь с нашей 
                                <a href="${privacyPath}" class="cookie-link-privacy" target="_blank">Политикой конфиденциальности</a>.
                            </p>
                        </div>
                        <div class="cookie-consent-actions">
                            <button class="btn-cookie btn-cookie-accept" onclick="CookieConsentModule.accept()">
                                <i class="fas fa-check"></i>
                                <span>Принять</span>
                            </button>
                            <button class="btn-cookie btn-cookie-decline" onclick="CookieConsentModule.decline()">
                                <span>Отклонить</span>
                            </button>
                            <button class="btn-cookie btn-cookie-settings" onclick="CookieConsentModule.showSettings()" title="Настройки cookies">
                                <i class="fas fa-cog"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="cookie-settings-modal" id="cookieSettingsModal">
                    <div class="cookie-settings-overlay" onclick="CookieConsentModule.hideSettings()"></div>
                    <div class="cookie-settings-content">
                        <div class="cookie-settings-header">
                            <h3>Настройки cookies</h3>
                            <button class="cookie-settings-close" onclick="CookieConsentModule.hideSettings()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="cookie-settings-body">
                            <div class="cookie-setting-item">
                                <div class="cookie-setting-info">
                                    <h4>Необходимые cookies</h4>
                                    <p>Эти cookies необходимы для работы сайта и не могут быть отключены.</p>
                                </div>
                                <label class="cookie-toggle disabled">
                                    <input type="checkbox" checked disabled>
                                    <span class="cookie-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="cookie-setting-item">
                                <div class="cookie-setting-info">
                                    <h4>Аналитические cookies</h4>
                                    <p>Помогают нам понять, как посетители взаимодействуют с сайтом.</p>
                                </div>
                                <label class="cookie-toggle" id="analyticsToggle">
                                    <input type="checkbox" checked>
                                    <span class="cookie-toggle-slider"></span>
                                </label>
                            </div>
                            <div class="cookie-setting-item">
                                <div class="cookie-setting-info">
                                    <h4>Маркетинговые cookies</h4>
                                    <p>Используются для отслеживания посетителей на разных сайтах.</p>
                                </div>
                                <label class="cookie-toggle" id="marketingToggle">
                                    <input type="checkbox">
                                    <span class="cookie-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                        <div class="cookie-settings-footer">
                            <button class="btn-cookie btn-cookie-save" onclick="CookieConsentModule.saveSettings()">
                                Сохранить настройки
                            </button>
                            <button class="btn-cookie btn-cookie-accept-all" onclick="CookieConsentModule.acceptAll()">
                                Принять все
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add banner to DOM first
            document.body.appendChild(banner);
            
            // Add styles
            this.injectStyles();
            
            // Wait for DOM and styles to be ready
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Add event listeners for privacy link
                    const privacyLink = banner.querySelector('.cookie-link-privacy');
                    if (privacyLink) {
                        const self = this;
                        privacyLink.addEventListener('click', function(e) {
                            self.trackPrivacyClick();
                        });
                    }
                    
                    // Get elements
                    const overlay = banner.querySelector('.cookie-consent-overlay');
                    const container = banner.querySelector('.cookie-consent-container');
                    
                    // Проверяем что элементы существуют
                    if (!overlay || !container) {
                        console.error('Cookie consent: элементы не найдены');
                        return;
                    }
                    
                    // Показываем overlay и контейнер одновременно
            setTimeout(() => {
                        overlay.classList.add('show');
                        container.classList.add('show');
                    }, 150);
                });
            });
        },
        
        accept: function() {
            this.setConsent('accepted');
            this.hideBanner();
            this.initAnalytics();
        },
        
        decline: function() {
            this.setConsent('declined');
            this.hideBanner();
        },
        
        hideBanner: function() {
            const banner = document.getElementById('cookieConsent');
            if (banner) {
                const container = banner.querySelector('.cookie-consent-container');
                const overlay = banner.querySelector('.cookie-consent-overlay');
                
                // Скрываем контейнер
                if (container) {
                    container.classList.remove('show');
                }
                
                // Скрываем overlay с небольшой задержкой
                if (overlay) {
                    setTimeout(() => {
                        overlay.classList.remove('show');
                    }, 200);
                }
                
                // Удаляем весь баннер
                setTimeout(() => {
                    if (banner.parentNode) {
                    banner.remove();
                    }
                }, 500);
            }
        },
        
        showSettings: function() {
            const modal = document.getElementById('cookieSettingsModal');
            if (modal) {
                // Load saved settings if any
                const savedSettings = localStorage.getItem('cookie_settings');
                if (savedSettings) {
                    try {
                        const settings = JSON.parse(savedSettings);
                        const analyticsToggle = document.getElementById('analyticsToggle');
                        const marketingToggle = document.getElementById('marketingToggle');
                        
                        if (analyticsToggle) {
                            analyticsToggle.querySelector('input').checked = settings.analytics !== false;
                        }
                        if (marketingToggle) {
                            marketingToggle.querySelector('input').checked = settings.marketing === true;
                        }
                    } catch (e) {
                        console.error('Error loading cookie settings:', e);
                    }
                }
                
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('show');
                }, 10);
            }
        },
        
        hideSettings: function() {
            const modal = document.getElementById('cookieSettingsModal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        },
        
        acceptAll: function() {
            this.setConsent('accepted');
            this.hideSettings();
            this.hideBanner();
            this.initAnalytics();
        },
        
        saveSettings: function() {
            const analyticsToggle = document.getElementById('analyticsToggle');
            const marketingToggle = document.getElementById('marketingToggle');
            
            if (!analyticsToggle || !marketingToggle) {
                console.error('Cookie settings toggles not found');
                return;
            }
            
            const analytics = analyticsToggle.querySelector('input').checked;
            const marketing = marketingToggle.querySelector('input').checked;
            
            const settings = {
                analytics: analytics,
                marketing: marketing
            };
            
            localStorage.setItem('cookie_settings', JSON.stringify(settings));
            
            if (analytics) {
                this.setConsent('accepted');
                this.initAnalytics();
            } else {
                this.setConsent('declined');
            }
            
            this.hideSettings();
            this.hideBanner();
        },
        
        trackPrivacyClick: function() {
            // Track privacy link click if analytics initialized
            try {
                if (window.gtag) {
                    window.gtag('event', 'cookie_privacy_click');
                }
                if (window.ym && YandexMetrika.counterId) {
                    window.ym(YandexMetrika.counterId, 'reachGoal', 'cookie_privacy_click');
                }
            } catch (e) {
                console.log('Analytics not initialized yet');
            }
        },
        
        initAnalytics: function() {
            console.log('📊 Initializing analytics...');
            GoogleAnalytics.init();
            YandexMetrika.init();
        },
        
        injectStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                .cookie-consent-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(31, 35, 55, 0.4);
                    backdrop-filter: blur(8px);
                    z-index: 9998;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }
                
                .cookie-consent-overlay.show {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .cookie-consent-container.show {
                    opacity: 1 !important;
                    transform: translateX(-50%) translateY(0) !important;
                }
                
                .cookie-consent-container {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%) translateY(120%);
                    opacity: 0;
                    z-index: 9999;
                    max-width: 640px;
                    width: calc(100% - 2rem);
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(252, 251, 255, 0.98) 100%);
                    backdrop-filter: blur(24px) saturate(180%);
                    border: 1.5px solid rgba(148, 167, 230, 0.35);
                    border-radius: 28px;
                    box-shadow: 0 24px 80px rgba(31, 35, 55, 0.25),
                                0 8px 32px rgba(148, 167, 230, 0.15),
                                inset 0 1px 0 rgba(255, 255, 255, 0.9);
                    padding: 2rem 2.5rem;
                    transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .cookie-consent-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    align-items: center;
                    text-align: center;
                }
                
                .cookie-consent-icon {
                    font-size: 3.5rem;
                    color: rgba(148, 167, 230, 0.8);
                    filter: drop-shadow(0 4px 12px rgba(148, 167, 230, 0.3));
                }
                
                .cookie-consent-text {
                    width: 100%;
                }
                
                .cookie-consent-text h3 {
                    font-size: 1.4rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                    color: var(--text-primary, #1f2337);
                    font-family: 'Unbounded', 'Inter', sans-serif;
                    letter-spacing: -0.02em;
                }
                
                .cookie-consent-text p {
                    font-size: 0.98rem;
                    line-height: 1.7;
                    color: var(--text-secondary, #5f647f);
                    margin-bottom: 0;
                }
                
                .cookie-link-privacy {
                    color: #7a95e0;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.2s;
                    border-bottom: 1.5px solid rgba(122, 149, 224, 0.3);
                }
                
                .cookie-link-privacy:hover {
                    color: #5f6ba3;
                    border-bottom-color: rgba(122, 149, 224, 0.6);
                }
                
                .cookie-consent-actions {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                    width: 100%;
                    justify-content: center;
                }
                
                .btn-cookie {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.875rem 1.75rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    border: none;
                    border-radius: 100px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-family: 'Inter', sans-serif;
                    white-space: nowrap;
                }
                
                .btn-cookie-accept {
                    background: linear-gradient(135deg, #7a95e0 0%, #a8b8ff 50%, #ffd1da 100%);
                    color: #1f2337;
                    flex: 1;
                    min-width: 140px;
                    box-shadow: 0 4px 16px rgba(122, 149, 224, 0.3);
                }
                
                .btn-cookie-accept:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(122, 149, 224, 0.4);
                }
                
                .btn-cookie-accept:active {
                    transform: translateY(-1px);
                }
                
                .btn-cookie-decline {
                    background: rgba(148, 167, 230, 0.12);
                    color: var(--text-secondary, #5f647f);
                    border: 1.5px solid rgba(148, 167, 230, 0.25);
                    flex: 1;
                    min-width: 140px;
                }
                
                .btn-cookie-decline:hover {
                    background: rgba(148, 167, 230, 0.2);
                    border-color: rgba(148, 167, 230, 0.4);
                    transform: translateY(-2px);
                }
                
                .btn-cookie-settings {
                    background: rgba(148, 167, 230, 0.12);
                    color: var(--text-secondary, #5f647f);
                    border: 1.5px solid rgba(148, 167, 230, 0.25);
                    padding: 0.875rem 1.25rem;
                    min-width: auto;
                }
                
                .btn-cookie-settings:hover {
                    background: rgba(148, 167, 230, 0.2);
                    border-color: rgba(148, 167, 230, 0.4);
                    transform: translateY(-2px) rotate(90deg);
                }
                
                /* Settings Modal */
                .cookie-settings-modal {
                    display: none;
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .cookie-settings-modal.show {
                    opacity: 1;
                }
                
                .cookie-settings-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(31, 35, 55, 0.6);
                    backdrop-filter: blur(8px);
                }
                
                .cookie-settings-content {
                    position: relative;
                    background: linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(252, 251, 255, 0.98) 100%);
                    backdrop-filter: blur(24px) saturate(180%);
                    border: 1.5px solid rgba(148, 167, 230, 0.35);
                    border-radius: 32px;
                    box-shadow: 0 32px 96px rgba(31, 35, 55, 0.3),
                                0 12px 40px rgba(148, 167, 230, 0.2),
                                inset 0 1px 0 rgba(255, 255, 255, 0.9);
                    padding: 2.5rem;
                    max-width: 560px;
                    width: calc(100% - 2rem);
                    max-height: 90vh;
                    overflow-y: auto;
                    transform: scale(0.9);
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .cookie-settings-modal.show .cookie-settings-content {
                    transform: scale(1);
                }
                
                .cookie-settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(148, 167, 230, 0.2);
                }
                
                .cookie-settings-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary, #1f2337);
                    font-family: 'Unbounded', 'Inter', sans-serif;
                    margin: 0;
                }
                
                .cookie-settings-close {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(148, 167, 230, 0.12);
                    border: 1.5px solid rgba(148, 167, 230, 0.25);
                    border-radius: 50%;
                    cursor: pointer;
                    color: var(--text-secondary, #5f647f);
                    transition: all 0.2s;
                    font-size: 1.1rem;
                }
                
                .cookie-settings-close:hover {
                    background: rgba(148, 167, 230, 0.2);
                    transform: rotate(90deg);
                }
                
                .cookie-settings-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                
                .cookie-setting-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 1.5rem;
                    padding: 1.25rem;
                    background: rgba(148, 167, 230, 0.06);
                    border: 1px solid rgba(148, 167, 230, 0.2);
                    border-radius: 16px;
                }
                
                .cookie-setting-info {
                    flex: 1;
                }
                
                .cookie-setting-info h4 {
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: var(--text-primary, #1f2337);
                    margin-bottom: 0.5rem;
                }
                
                .cookie-setting-info p {
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: var(--text-secondary, #5f647f);
                    margin: 0;
                }
                
                .cookie-toggle {
                    position: relative;
                    display: inline-block;
                    width: 52px;
                    height: 28px;
                    flex-shrink: 0;
                }
                
                .cookie-toggle input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .cookie-toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(148, 167, 230, 0.3);
                    transition: 0.3s;
                    border-radius: 28px;
                }
                
                .cookie-toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 22px;
                    width: 22px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: 0.3s;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(31, 35, 55, 0.2);
                }
                
                .cookie-toggle input:checked + .cookie-toggle-slider {
                    background: linear-gradient(135deg, #7a95e0 0%, #a8b8ff 100%);
                }
                
                .cookie-toggle input:checked + .cookie-toggle-slider:before {
                    transform: translateX(24px);
                }
                
                .cookie-toggle.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .cookie-settings-footer {
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                
                .btn-cookie-save,
                .btn-cookie-accept-all {
                    flex: 1;
                    min-width: 140px;
                }
                
                .btn-cookie-save {
                    background: linear-gradient(135deg, #7a95e0 0%, #a8b8ff 100%);
                    color: #1f2337;
                    box-shadow: 0 4px 16px rgba(122, 149, 224, 0.3);
                }
                
                .btn-cookie-save:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 24px rgba(122, 149, 224, 0.4);
                }
                
                .btn-cookie-accept-all {
                    background: rgba(148, 167, 230, 0.12);
                    color: var(--text-secondary, #5f647f);
                    border: 1.5px solid rgba(148, 167, 230, 0.25);
                }
                
                .btn-cookie-accept-all:hover {
                    background: rgba(148, 167, 230, 0.2);
                    transform: translateY(-2px);
                }
                
                @media (max-width: 768px) {
                    .cookie-consent-container {
                        bottom: 0;
                        left: 0;
                        right: 0;
                        transform: translateY(100%);
                        width: 100%;
                        max-width: 100%;
                        border-radius: 24px 24px 0 0;
                        padding: 1.75rem 1.5rem;
                        border-left: none;
                        border-right: none;
                        border-bottom: none;
                        border-top: 1.5px solid rgba(148, 167, 230, 0.35);
                    }
                    
                    .cookie-consent-container.show {
                        transform: translateY(0) !important;
                    }

                    .cookie-consent-content {
                        gap: 1.25rem;
                    }

                    .cookie-consent-icon {
                        font-size: 2.5rem;
                    }
                    
                    .cookie-consent-text h3 {
                        font-size: 1.2rem;
                    }

                    .cookie-consent-text p {
                        font-size: 0.9rem;
                    }

                    .cookie-consent-actions {
                        flex-direction: column;
                        gap: 0.625rem;
                    }
                    
                    .btn-cookie {
                        padding: 0.75rem 1.5rem;
                        font-size: 0.9rem;
                        width: 100%;
                    }
                    
                    .cookie-settings-content {
                        padding: 1.75rem 1.5rem;
                        border-radius: 24px 24px 0 0;
                        max-height: 85vh;
                    }
                    
                    .cookie-setting-item {
                        flex-direction: column;
                        gap: 1rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    // ==========================================
    // GOOGLE ANALYTICS 4
    // ==========================================
    
    const GoogleAnalytics = {
        measurementId: 'G-XXXXXXXXXX', // REPLACE WITH YOUR MEASUREMENT ID
        
        init: function() {
            if (!this.measurementId || this.measurementId === 'G-XXXXXXXXXX') {
                console.warn('⚠️ Google Analytics ID not configured');
                return;
            }
            
            // Load GA4 script
            const script1 = document.createElement('script');
            script1.async = true;
            script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
            document.head.appendChild(script1);
            
            // Initialize GA4
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', this.measurementId, {
                'anonymize_ip': true,
                'cookie_flags': 'SameSite=None;Secure'
            });
            
            window.gtag = gtag;
            
            console.log('✅ Google Analytics 4 initialized');
        },
        
        // Custom events
        trackEvent: function(eventName, parameters = {}) {
            if (window.gtag) {
                window.gtag('event', eventName, parameters);
            }
        },
        
        trackPageView: function(pagePath, pageTitle) {
            if (window.gtag) {
                window.gtag('event', 'page_view', {
                    page_path: pagePath,
                    page_title: pageTitle
                });
            }
        },
        
        trackDownload: function(fileName) {
            this.trackEvent('download', {
                file_name: fileName
            });
        },
        
        trackFormSubmit: function(formName) {
            this.trackEvent('form_submit', {
                form_name: formName
            });
        }
    };
    
    // ==========================================
    // YANDEX METRIKA
    // ==========================================
    
    const YandexMetrika = {
        counterId: null, // REPLACE WITH YOUR COUNTER ID (e.g., 12345678)
        
        init: function() {
            if (!this.counterId) {
                console.warn('⚠️ Yandex Metrika ID not configured');
                return;
            }
            
            // Load Yandex Metrika script
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],
                k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
            
            ym(this.counterId, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
            });
            
            console.log('✅ Yandex Metrika initialized');
        },
        
        // Custom goals
        reachGoal: function(goalName, params = {}) {
            if (window.ym && this.counterId) {
                window.ym(this.counterId, 'reachGoal', goalName, params);
            }
        }
    };
    
    // ==========================================
    // CUSTOM TRACKING FUNCTIONS
    // ==========================================
    
    const CustomTracking = {
        init: function() {
            this.trackOutboundLinks();
            this.trackDownloads();
            this.trackFormSubmissions();
            this.trackScrollDepth();
            this.trackPrimaryCtas();
            this.trackFunnelSteps();
        },

        sendUnifiedEvent: function(eventName, params = {}) {
            GoogleAnalytics.trackEvent(eventName, params);
            YandexMetrika.reachGoal(eventName, params);
        },
        
        trackOutboundLinks: function() {
            document.addEventListener('click', function(e) {
                const link = e.target.closest('a');
                if (!link) return;
                
                const href = link.getAttribute('href');
                if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
                    GoogleAnalytics.trackEvent('outbound_link', {
                        link_url: href,
                        link_text: link.textContent
                    });
                }
            });
        },
        
        trackDownloads: function() {
            document.addEventListener('click', function(e) {
                const link = e.target.closest('a');
                if (!link) return;
                
                const href = link.getAttribute('href');
                if (href && /\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx)$/i.test(href)) {
                    GoogleAnalytics.trackDownload(href);
                    YandexMetrika.reachGoal('download');
                }
            });
        },
        
        trackFormSubmissions: function() {
            document.querySelectorAll('form').forEach(form => {
                form.addEventListener('submit', function(e) {
                    const formName = form.getAttribute('name') || form.id || 'unnamed_form';
                    GoogleAnalytics.trackFormSubmit(formName);
                    YandexMetrika.reachGoal('form_submit');
                });
            });
        },
        
        trackScrollDepth: function() {
            const depths = [25, 50, 75, 100];
            const tracked = {};
            let scrollRaf = null;
            const checkDepth = () => {
                const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (scrollableHeight <= 0) return;
                const scrollPercent = (window.scrollY / scrollableHeight) * 100;
                depths.forEach(depth => {
                    if (scrollPercent >= depth && !tracked[depth]) {
                        tracked[depth] = true;
                        GoogleAnalytics.trackEvent('scroll_depth', { depth: depth });
                    }
                });
                scrollRaf = null;
            };
            window.addEventListener('scroll', function() {
                if (!scrollRaf) scrollRaf = requestAnimationFrame(checkDepth);
            }, { passive: true });
        },

        trackPrimaryCtas: function() {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button');
                if (!target) return;

                const ctaName = target.getAttribute('data-cta-name');
                const isSticky = target.closest('.mobile-sticky-cta-premium');
                const isPricing = target.closest('.pricing-card-premium');
                const isHero = target.closest('.hero-cta-group');
                const isNav = target.classList.contains('nav-cta');
                const isStore = target.classList.contains('store-btn-premium') || target.classList.contains('footer-store-btn');

                if (!ctaName && !isSticky && !isPricing && !isHero && !isNav && !isStore) {
                    return;
                }

                const pricingCard = target.closest('.pricing-card-premium');
                const plan = pricingCard ? (pricingCard.querySelector('h3')?.textContent?.trim() || 'unknown') : undefined;
                const ctaText = target.textContent.trim().slice(0, 80);

                const section = isSticky ? 'mobile_sticky' : isPricing ? 'pricing' : isHero ? 'hero' : isNav ? 'nav' : isStore ? 'store' : 'other';
                const payload = {
                    cta_name: ctaName || 'auto_detected',
                    cta_text: ctaText,
                    section: section,
                    plan: plan,
                    page_path: window.location.pathname
                };

                // Unified event naming for dashboards
                this.sendUnifiedEvent('isseya_cta_click', payload);

                // Backward-compatible event name
                GoogleAnalytics.trackEvent('primary_cta_click', {
                    cta_name: ctaName || 'auto_detected',
                    cta_text: ctaText,
                    section: section,
                    plan: plan
                });
            });
        },

        trackFunnelSteps: function() {
            if (!('IntersectionObserver' in window)) return;

            const steps = [
                { selector: '.hero-premium', step: 'hero' },
                { selector: '#pricing', step: 'pricing' },
                { selector: '#download', step: 'download' }
            ];

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const step = entry.target.getAttribute('data-funnel-step') || entry.target.id || 'unknown';
                    this.sendUnifiedEvent('isseya_funnel_step_view', {
                        step: step,
                        page_path: window.location.pathname
                    });
                    observer.unobserve(entry.target);
                });
            }, { threshold: 0.4 });

            steps.forEach(item => {
                const el = document.querySelector(item.selector);
                if (!el) return;
                el.setAttribute('data-funnel-step', item.step);
                observer.observe(el);
            });
        }
    };
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    // Expose to window for cookie consent
    window.CookieConsentModule = CookieConsent;
    window.AnalyticsModule = {
        ga: GoogleAnalytics,
        ym: YandexMetrika,
        tracking: CustomTracking
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            CookieConsent.init();
            CustomTracking.init();
        });
    } else {
        CookieConsent.init();
        CustomTracking.init();
    }
    
    console.log('🍪 Analytics module loaded');
    
})();

