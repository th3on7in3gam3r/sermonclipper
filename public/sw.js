/* Vesper PWA service worker — app shell + thumbnail cache + offline queue sync */

const CACHE_VERSION = 'vesper-v4';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const THUMB_CACHE = `${CACHE_VERSION}-thumbs`;

const SHELL_URLS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function shouldBypassServiceWorker(request, url) {
  if (request.method !== 'GET') return true;

  // Next.js App Router flight requests, prefetch, and build assets must not be cached by the SW.
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') ||
    request.headers.get('Next-Router-Segment-Prefetch') ||
    request.headers.get('Next-Router-State-Tree') ||
    request.headers.get('Next-Url') ||
    (request.headers.get('Accept') || '').includes('text/x-component')
  ) {
    return true;
  }

  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypassServiceWorker(request, url)) return;

  // Thumbnail / clip preview images
  if (url.pathname.includes('/thumbnail') || url.pathname.includes('/api/proxy-image')) {
    event.respondWith(cacheFirst(request, THUMB_CACHE));
    return;
  }

  // Offline shell fallback for top-level document navigations only
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request));
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
    if (response.ok) {
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
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'VESPER_SYNC_OFFLINE_QUEUE' });
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Vesper Studio', body: 'You have a new update', url: '/dashboard', tag: 'vesper' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: { url: payload.url },
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.postMessage({ type: 'VESPER_NAVIGATE', url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
