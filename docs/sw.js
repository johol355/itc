// Service Worker for Medical Guidelines PWA
const CACHE_NAME = 'medical-guidelines-v2';
const STATIC_CACHE = 'static-v2';
const RUNTIME_CACHE = 'runtime-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/checklist.js',
    '/styles.css',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle same-origin requests
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Cache guidelines and other resources
                    if (url.pathname.includes('/guidelines/') || 
                        url.pathname.includes('.json') ||
                        url.pathname.includes('.css') ||
                        url.pathname.includes('.js')) {
                        
                        const responseToCache = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    
                    return response;
                }).catch(() => {
                    // Offline fallback
                    if (url.pathname.includes('/guidelines/')) {
                        return new Response(`
                            <div class="offline-content">
                                <h2>Offline</h2>
                                <p>This guideline is not available offline. Please connect to the internet to access it.</p>
                            </div>
                        `, {
                            headers: { 'Content-Type': 'text/html' }
                        });
                    }
                    
                    // Return cached index for navigation requests
                    if (request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
        );
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'checklist-sync') {
        event.waitUntil(syncChecklistData());
    }
});

async function syncChecklistData() {
    // Placeholder for syncing checklist progress when back online
    console.log('Syncing checklist data...');
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png'
        });
    }
});