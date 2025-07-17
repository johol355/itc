// Service Worker for Medical Guidelines PWA - EMERGENCY READY
const CACHE_NAME = 'medical-guidelines-v3';
const STATIC_CACHE = 'static-v3';
const RUNTIME_CACHE = 'runtime-v3';
const GUIDELINES_CACHE = 'guidelines-v3';

// Critical assets that MUST be cached immediately
const STATIC_ASSETS = [
    '/itc/',
    '/itc/index.html',
    '/itc/app.js',
    '/itc/checklist.js',
    '/itc/styles.css',
    '/itc/manifest.json'
];

// Pre-cache all guidelines for emergency access
const PRECACHE_GUIDELINES = [
    '/itc/guidelines/index.json'
    // Additional guidelines will be added dynamically
];

// Install event - aggressively cache everything for emergency access
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
            // Pre-cache guidelines index
            caches.open(GUIDELINES_CACHE).then((cache) => cache.addAll(PRECACHE_GUIDELINES)),
            // Pre-cache all existing guidelines
            preloadAllGuidelines()
        ]).then(() => self.skipWaiting())
    );
});

// Preload all guidelines for instant emergency access
async function preloadAllGuidelines() {
    try {
        const indexResponse = await fetch('/itc/guidelines/index.json');
        const indexData = await indexResponse.json();
        const guidelinesCache = await caches.open(GUIDELINES_CACHE);
        
        // Cache the index
        await guidelinesCache.put('/itc/guidelines/index.json', indexResponse.clone());
        
        // Cache all individual guidelines
        const promises = indexData.guidelines.map(async (guideline) => {
            try {
                const guidelineUrl = `/itc/guidelines/${guideline.html}`;
                const response = await fetch(guidelineUrl);
                if (response.ok) {
                    await guidelinesCache.put(guidelineUrl, response);
                    console.log(`Cached guideline: ${guideline.title}`);
                }
            } catch (error) {
                console.warn(`Failed to cache guideline: ${guideline.title}`, error);
            }
        });
        
        await Promise.all(promises);
        console.log('All guidelines pre-cached for emergency access');
    } catch (error) {
        console.warn('Failed to preload guidelines:', error);
    }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE && cacheName !== GUIDELINES_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - OFFLINE FIRST for emergency access
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle same-origin requests with offline-first strategy
    if (url.origin === location.origin) {
        event.respondWith(
            // ALWAYS try cache first for instant access
            caches.match(request).then((cachedResponse) => {
                // If we have it cached, return immediately (emergency ready)
                if (cachedResponse) {
                    // Update cache in background if online
                    if (navigator.onLine) {
                        fetch(request).then((response) => {
                            if (response && response.status === 200) {
                                const cache = url.pathname.includes('/guidelines/') ? 
                                    caches.open(GUIDELINES_CACHE) : 
                                    caches.open(RUNTIME_CACHE);
                                cache.then((c) => c.put(request, response.clone()));
                            }
                        }).catch(() => {/* Silent fail for background updates */});
                    }
                    return cachedResponse;
                }
                
                // Not in cache - try network (only if online)
                if (navigator.onLine) {
                    return fetch(request).then((response) => {
                        // Don't cache failed responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Cache important resources immediately
                        const responseToCache = response.clone();
                        if (url.pathname.includes('/guidelines/')) {
                            caches.open(GUIDELINES_CACHE).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        } else if (url.pathname.includes('.json') || 
                                   url.pathname.includes('.css') || 
                                   url.pathname.includes('.js')) {
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        
                        return response;
                    }).catch(() => {
                        // Network failed - return meaningful offline response
                        return getOfflineFallback(url);
                    });
                } else {
                    // Offline and not cached - return offline fallback immediately
                    return getOfflineFallback(url);
                }
            })
        );
    }
});

// Emergency offline fallback
function getOfflineFallback(url) {
    if (url.pathname.includes('/guidelines/') && url.pathname.endsWith('.html')) {
        return new Response(`
            <div class="emergency-offline">
                <h2>⚠️ Emergency Mode</h2>
                <p><strong>This guideline is not available offline.</strong></p>
                <p>For emergency access, ensure guidelines are loaded when online.</p>
                <button onclick="window.history.back()">← Back to Available Guidelines</button>
            </div>
            <style>
                .emergency-offline { 
                    padding: 2rem; 
                    text-align: center; 
                    background: #fff3cd; 
                    border: 2px solid #f44336; 
                    margin: 1rem; 
                    border-radius: 8px;
                }
                .emergency-offline h2 { color: #f44336; }
                .emergency-offline button { 
                    background: #2196F3; 
                    color: white; 
                    border: none; 
                    padding: 1rem 2rem; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    margin-top: 1rem;
                }
            </style>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // Return cached index for navigation requests
    if (request.destination === 'document') {
        return caches.match('/itc/index.html');
    }
    
    return new Response('Offline - Resource not available', { status: 503 });
}

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