const CACHE_NAME = 'er-repair-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin, network-first for external
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip Firebase, EmailJS, analytics
  if (/firestore|googleapis\.com\/identitytoolkit|emailjs/.test(url.href)) return;

  if (url.origin === self.location.origin) {
    // Cache-first for local assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  } else {
    // Network-first for external (fonts, images)
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
