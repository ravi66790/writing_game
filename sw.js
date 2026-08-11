/* ================================================================
   Service Worker for Spelling Adventure
   Caches the app shell so it installs as a real app and still
   opens (game screens, drawing, etc.) even with a poor connection.
   Note: the handwriting-recognition engine (Tesseract.js) is loaded
   from a CDN and needs internet the first time it's used — after
   that, the browser's own HTTP cache usually keeps it fast.
   ================================================================ */

const CACHE_NAME = 'spelling-adventure-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for app-shell files, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        }).catch(() => cached);
      })
    );
  }
  // Cross-origin requests (fonts, Tesseract CDN, language data) just go to the network as normal.
});
