/**
 * TradeOS Service Worker v2.0
 * 
 * Features:
 * - Automatic update detection on new deployments
 * - Clean cache invalidation
 * - Network-first for API, cache-first for static assets
 * - Broadcasts update availability to clients
 * - Proper skipWaiting/claim flow for seamless updates
 */

// Dynamic version based on build - will be replaced during build
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `tradeos-${CACHE_VERSION}`;
const BUILD_TIMESTAMP = new Date().toISOString();

// Assets to pre-cache for offline support
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - pre-cache essential assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing TradeOS service worker ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Pre-caching complete');
        // Notify all clients that a new version is waiting
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATE_WAITING',
              version: CACHE_VERSION,
              buildTimestamp: BUILD_TIMESTAMP
            });
          });
        });
      })
      .catch((err) => {
        console.error('[SW] Pre-caching failed:', err);
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating TradeOS service worker ${CACHE_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Clean up ALL old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('tradeos-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      // Notify all clients that the new version is now active
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION,
            buildTimestamp: BUILD_TIMESTAMP
          });
        });
      });
    })
  );
});

// Fetch event - network-first for API and HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api')) return;
  
  // Skip WebSocket and other non-http
  if (!url.protocol.startsWith('http')) return;
  
  // Skip cross-origin requests (except for CDNs if needed)
  if (url.origin !== self.location.origin) return;
  
  // Skip Supabase requests
  if (url.hostname.includes('supabase')) return;

  // For HTML navigation requests - always try network first for fresh content
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh HTML
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
            .then(cachedResponse => cachedResponse || caches.match('/index.html'));
        })
    );
    return;
  }

  // For JS/CSS bundles with hashes - cache-first (immutable)
  if (url.pathname.match(/\.(js|css)$/) && url.pathname.includes('.')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // For other static assets - network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  // Skip waiting and activate new service worker
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping wait, activating new version');
    self.skipWaiting();
  }
  
  // Get current version info
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        version: CACHE_VERSION,
        buildTimestamp: BUILD_TIMESTAMP
      });
    }
  }
  
  // Clear all caches (for debugging/recovery)
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then(names => {
      Promise.all(names.map(name => caches.delete(name)))
        .then(() => {
          console.log('[SW] All caches cleared');
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        });
    });
  }
});

// Listen for controllerchange to reload after sw update
self.addEventListener('controllerchange', () => {
  console.log('[SW] Controller changed, new service worker active');
});
