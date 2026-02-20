/**
 * TradeOS Service Worker
 * Handles caching and update notifications
 */

const CACHE_NAME = 'tradeos-v1';
const VERSION = '1.0.0';

// Assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/shield-icon.png'
];

// Install event - pre-cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Pre-caching complete');
      })
      .catch((err) => {
        console.error('[SW] Pre-caching failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v' + VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first strategy for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api')) return;
  
  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Message event - handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received skip waiting message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: VERSION,
        buildDate: new Date().toISOString()
      });
    }
  }
});
