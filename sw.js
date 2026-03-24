const CACHE = 'bone-and-billing-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './app/styles/tokens.css',
  './app/styles/main.css',
  './app/styles/print.css',
  './app/scripts/main.js',
  './app/scripts/data/indexeddb.js',
  './app/scripts/data/repository.js',
  './app/scripts/domain/billing.js',
  './app/scripts/state/store.js',
  './app/scripts/ui/render.js',
  './app/scripts/utils/format.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
