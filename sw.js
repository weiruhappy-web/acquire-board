const CACHE = 'acquire-market-v3';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/continental-certificate.jpg',
  './assets/continental-building.png',
  './assets/imperial-certificate.jpg',
  './assets/imperial-building.png',
  './assets/american-certificate.jpg',
  './assets/american-building.png',
  './assets/festival-certificate.jpg',
  './assets/festival-building.png',
  './assets/worldwide-certificate.jpg',
  './assets/worldwide-building.png',
  './assets/sackson-certificate.jpg',
  './assets/sackson-building.png',
  './assets/tower-certificate.jpg',
  './assets/tower-building.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Frequently edited app files: try the network first, then fall back to cache offline.
  if (
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/style.css') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/acquire-board/')
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Stable images/icons: cache first for fast offline use.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
