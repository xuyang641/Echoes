// Service Worker for Offline-First Experience
// Using Workbox libraries (assumed available or implementing basic SW logic)

const CACHE_NAME = 'photo-diary-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other critical static assets here
];

// Install Event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force waiting service worker to become active
  self.skipWaiting();
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate for static, Network-First for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-http requests (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // Strategy 1: Stale-While-Revalidate for Static Assets (JS, CSS, Images, Fonts)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|json)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Update cache with new version
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy 2: Network-First for Navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html'); // Fallback to app shell
        })
    );
    return;
  }

  // Strategy 3: Network-First for API calls (Supabase/AI)
  // We generally want fresh data, but fall back to cache if offline?
  // Actually, for Supabase, we rely on our internal 'offline-storage' (IndexedDB) logic 
  // rather than SW caching, to handle sync properly. 
  // So we just let these pass through to network, and if they fail, 
  // the app's error handling + offlineStorage takes over.
  
  // Default: Network Only
  // event.respondWith(fetch(event.request));
});
