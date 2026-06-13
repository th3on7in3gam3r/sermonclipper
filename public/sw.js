/* Vesper PWA service worker — app shell + thumbnail cache + offline queue sync */

const CACHE_VERSION = 'vesper-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const THUMB_CACHE = `${CACHE_VERSION}-thumbs`;
const OFFLINE_QUEUE_KEY = 'vesper-offline-queue';

const SHELL_URLS = ['/', '/dashboard', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Thumbnail / clip preview images
  if (url.pathname.includes('/thumbnail') || url.pathname.includes('/api/proxy-image')) {
    event.respondWith(cacheFirst(request, THUMB_CACHE));
    return;
  }

  // App navigation + static assets
  if (request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(networkFirstShell(request));
    return;
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'vesper-offline-sync') {
    event.waitUntil(flushOfflineQueue());
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && request.mode === 'navigate') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const fallback = await cache.match('/');
    if (fallback) return fallback;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function flushOfflineQueue() {
  // Queue items are stored in IndexedDB by the client; sync tag triggers client message
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'VESPER_SYNC_OFFLINE_QUEUE' });
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
