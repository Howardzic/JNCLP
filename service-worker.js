// JNC Service Worker v1.0
const CACHE_NAME = 'jnc-v1';
const OFFLINE_URL = 'offline.html';

const PRECACHE = [
  'jnc-portal.html',
  'jnc-admin.html',
  'offline.html',
  'manifest.json',
];

// ── INSTALL: precache core files ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: network first, fallback to cache, then offline ──
self.addEventListener('fetch', event => {
  // skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          // for navigation requests show offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 408 });
        })
      )
  );
});

// ── BACKGROUND SYNC placeholder ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    // future: sync queued form submissions
    console.log('[JNC SW] Background sync triggered');
  }
});
