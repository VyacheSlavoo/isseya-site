// Service Worker для Иссеи.
// Стратегии:
//  - HTML-документы: network-first (всегда свежее, при оффлайне — кэш).
//  - Свои JS/CSS/шрифты: stale-while-revalidate (моментально из кэша,
//    в фоне обновляется — деплои подхватываются на следующей загрузке).
//  - Другие GET (картинки, sw, manifest и т.п.): cache-first.
// Почему: предыдущие версии держали JS/CSS как cache-first и фиксировали
// устаревший код у пользователей. Теперь обновления доезжают всегда.

const CACHE_NAME = 'isseya-v19';
const PRECACHE_URLS = [
    './',
    './css/premium.css',
    './css/pages/home.css',
    './css/pages/unified-template.css',
    './fonts/isseya-fonts.css',
    './fonts/manrope-cyrillic.woff2',
    './fonts/manrope-cyrillic-ext.woff2',
    './fonts/manrope-latin.woff2',
    './fonts/manrope-latin-ext.woff2',
    './js/premium.js',
    './js/cookie-consent.js',
    './manifest.json',
    './images/hero-phone.webp',
    './pages/privacy.html',
    './pages/terms.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .catch((err) => console.warn('SW precache failed:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

function isSameOrigin(url) {
    try {
        return new URL(url, self.location.href).origin === self.location.origin;
    } catch (e) {
        return false;
    }
}

function isStaleWhileRevalidateTarget(url) {
    return /\.(?:js|css)$/i.test(url) || /\/fonts\/.*\.(?:woff2?|ttf|otf)$/i.test(url);
}

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }
    if (!isSameOrigin(request.url)) {
        return;
    }

    // 1) Документы: network-first.
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match('./')))
        );
        return;
    }

    // 2) Свои JS/CSS/шрифты: stale-while-revalidate.
    if (isStaleWhileRevalidateTarget(request.url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) =>
                cache.match(request).then((cached) => {
                    const networkFetch = fetch(request)
                        .then((response) => {
                            if (response && response.status === 200 && response.type === 'basic') {
                                cache.put(request, response.clone());
                            }
                            return response;
                        })
                        .catch(() => cached);
                    return cached || networkFetch;
                })
            )
        );
        return;
    }

    // 3) Остальное (картинки, manifest и т.п.): cache-first c обновлением фоном.
    event.respondWith(
        caches.match(request).then((cached) => cached || fetch(request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
        }))
    );
});
