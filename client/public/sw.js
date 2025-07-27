const CACHE_NAME = 'qr-genius-v1.0.0';
const STATIC_CACHE = 'qr-genius-static-v1';
const DYNAMIC_CACHE = 'qr-genius-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET responses for QR data
          if (response.ok && url.pathname.includes('/api/qr/')) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Fetch from network and cache
        return fetch(request)
          .then((response) => {
            // Don't cache if not successful
            if (!response.ok) {
              return response;
            }

            const responseClone = response.clone();
            const cacheToUse = STATIC_ASSETS.includes(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE;
            
            caches.open(cacheToUse)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Offline fallback for HTML pages
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/')
                .then((fallback) => {
                  if (fallback) {
                    return fallback;
                  }
                  return new Response(
                    `<!DOCTYPE html>
                    <html>
                    <head>
                      <title>QR Genius - Offline</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { 
                          font-family: system-ui, sans-serif; 
                          display: flex; 
                          align-items: center; 
                          justify-content: center; 
                          min-height: 100vh; 
                          margin: 0; 
                          background: linear-gradient(135deg, #0f0f23, #1a1a2e);
                          color: white;
                          text-align: center;
                        }
                        .offline-content {
                          max-width: 400px;
                          padding: 2rem;
                        }
                        .logo {
                          width: 64px;
                          height: 64px;
                          background: linear-gradient(135deg, #6366f1, #8b5cf6);
                          border-radius: 16px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          margin: 0 auto 1rem;
                          font-weight: bold;
                          font-size: 1.5rem;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="offline-content">
                        <div class="logo">QR</div>
                        <h1>You're Offline</h1>
                        <p>QR Genius works offline! Your previously created QR codes are still available in your browser's local storage.</p>
                        <p>Connect to the internet to create new shareable QR codes.</p>
                      </div>
                    </body>
                    </html>`,
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            throw error;
          });
      })
  );
});

// Handle background sync for offline QR creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'qr-sync') {
    console.log('[SW] Background sync triggered');
    // Could implement offline QR queue here
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  // Future: Handle QR analytics notifications
});

console.log('[SW] Service Worker loaded');