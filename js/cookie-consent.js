// Local cookie notice. Stores the user's choice for one year.
(function() {
    'use strict';

    const COOKIE_NAME = 'isseya_cookie_consent';
    const LEGACY_COOKIE_NAME = 'psychoteka_cookie_consent';
    const STORAGE_KEY = 'isseya_cookie_consent';

    function getCookie(name) {
        const item = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`));
        return item ? decodeURIComponent(item.split('=').slice(1).join('=')) : null;
    }

    function getConsent() {
        return getCookie(COOKIE_NAME) || getCookie(LEGACY_COOKIE_NAME) || localStorage.getItem(STORAGE_KEY);
    }

    function setConsent(value) {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secure}`;
        localStorage.setItem(STORAGE_KEY, value);
    }

    function privacyPath() {
        return window.location.pathname.includes('/pages/') ? 'privacy.html' : 'pages/privacy.html';
    }

    function hideBanner() {
        const banner = document.getElementById('cookieConsent');
        if (!banner) return;
        banner.classList.remove('show');
        window.setTimeout(() => banner.remove(), 220);
    }

    function accept() {
        setConsent('accepted');
        hideBanner();
    }

    function decline() {
        setConsent('declined');
        hideBanner();
    }

    function injectStyles() {
        if (document.getElementById('cookie-consent-styles')) return;
        const style = document.createElement('style');
        style.id = 'cookie-consent-styles';
        style.textContent = `
            .cookie-consent {
                position: fixed;
                left: 50%;
                bottom: calc(24px + env(safe-area-inset-bottom));
                transform: translate(-50%, 18px);
                width: min(640px, calc(100% - 32px));
                z-index: 10000;
                display: grid;
                gap: 14px;
                padding: 18px 20px;
                border: 1px solid rgba(148, 167, 230, 0.32);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.96);
                color: var(--text-primary, #363753);
                box-shadow: 0 18px 44px rgba(63, 70, 106, 0.16);
                opacity: 0;
                visibility: hidden;
                transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
            }
            .cookie-consent.show {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, 0);
            }
            .cookie-consent__text {
                font-size: 0.92rem;
                line-height: 1.55;
                color: var(--text-secondary, #54567a);
            }
            .cookie-consent__text strong {
                display: block;
                margin-bottom: 4px;
                color: var(--text-primary, #363753);
            }
            .cookie-consent__text a {
                color: var(--primary-700, #5f6ba3);
                font-weight: 700;
                text-decoration: none;
                border-bottom: 1px solid rgba(95, 107, 163, 0.35);
            }
            .cookie-consent__actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: flex-end;
            }
            .cookie-consent__button {
                min-height: 42px;
                padding: 10px 18px;
                border-radius: 999px;
                border: 1px solid rgba(148, 167, 230, 0.35);
                background: rgba(148, 167, 230, 0.12);
                color: var(--text-primary, #363753);
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }
            .cookie-consent__button--primary {
                background: var(--gradient-primary, #e5d4fa);
            }
            @media (max-width: 520px) {
                .cookie-consent {
                    bottom: 0;
                    width: 100%;
                    border-radius: 22px 22px 0 0;
                    border-left: 0;
                    border-right: 0;
                    padding: 16px;
                }
                .cookie-consent__actions,
                .cookie-consent__button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function showBanner() {
        if (getConsent() || document.getElementById('cookieConsent')) return;

        injectStyles();
        const banner = document.createElement('div');
        banner.id = 'cookieConsent';
        banner.className = 'cookie-consent';
        banner.innerHTML = `
            <div class="cookie-consent__text">
                <strong>Мы используем cookies</strong>
                Только необходимые для корректной работы сайта. Подробнее — в
                <a href="${privacyPath()}" target="_blank" rel="noopener">Политике конфиденциальности</a>.
            </div>
            <div class="cookie-consent__actions">
                <button class="cookie-consent__button" type="button" data-cookie-decline>Отклонить</button>
                <button class="cookie-consent__button cookie-consent__button--primary" type="button" data-cookie-accept>Понятно</button>
            </div>
        `;
        banner.querySelector('[data-cookie-accept]').addEventListener('click', accept);
        banner.querySelector('[data-cookie-decline]').addEventListener('click', decline);
        document.body.appendChild(banner);
        requestAnimationFrame(() => banner.classList.add('show'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
    } else {
        showBanner();
    }
})();
