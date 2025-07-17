// Service Worker for Medical Guidelines PWA - Offline First
const CACHE_NAME = 'medical-guidelines-v5';
const STATIC_CACHE = 'static-v5';
const GUIDELINES_CACHE = 'guidelines-v5';

// Critical assets that MUST be cached immediately
const STATIC_ASSETS = [
    '/itc/',
    '/itc/index.html',
    '/itc/app.js',
    '/itc/checklist.js',
    '/itc/styles.css',
    '/itc/manifest.json',
    '/itc/guidelines/index.json'
];

// Install event - cache everything immediately 
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        (async () => {
            try {
                // Cache static assets first
                const staticCache = await caches.open(STATIC_CACHE);
                await staticCache.addAll(STATIC_ASSETS);
                console.log('Static assets cached');
                
                // Cache all guidelines immediately
                await cacheAllGuidelines();
                
                console.log('Installation complete - all content cached');
                self.skipWaiting();
            } catch (error) {
                console.error('Installation failed:', error);
            }
        })()
    );
});

// Cache all guidelines immediately and aggressively
async function cacheAllGuidelines() {
    try {
        const guidelinesCache = await caches.open(GUIDELINES_CACHE);
        
        // Fetch and cache the index
        const indexResponse = await fetch('/itc/guidelines/index.json');
        await guidelinesCache.put('/itc/guidelines/index.json', indexResponse.clone());
        
        const indexData = await indexResponse.json();
        console.log(`Found ${indexData.guidelines.length} guidelines to cache`);
        
        // Cache each guideline individually
        for (const guideline of indexData.guidelines) {
            try {
                const guidelineUrl = `/itc/guidelines/${guideline.html}`;
                const response = await fetch(guidelineUrl);
                
                if (response.ok) {
                    await guidelinesCache.put(guidelineUrl, response.clone());
                    console.log(`✓ Cached: ${guideline.title}`);
                } else {
                    console.warn(`Failed to fetch: ${guideline.title} (${response.status})`);
                }
            } catch (error) {
                console.warn(`Error caching ${guideline.title}:`, error);
            }
        }
        
        console.log('All guidelines cached successfully');
    } catch (error) {
        console.error('Failed to cache guidelines:', error);
    }
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        (async () => {
            // Clean up old caches
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== GUIDELINES_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
            
            // Take control of all pages
            await self.clients.claim();
            console.log('Service Worker activated');
        })()
    );
});

// Fetch event - Cache first, then network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    event.respondWith(
        (async () => {
            // Try cache first
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                console.log('Serving from cache:', request.url);
                return cachedResponse;
            }
            
            // Not in cache, try network
            try {
                const networkResponse = await fetch(request);
                
                if (networkResponse.ok) {
                    // Cache the response for future use
                    const cache = url.pathname.includes('/guidelines/') ? 
                        await caches.open(GUIDELINES_CACHE) : 
                        await caches.open(STATIC_CACHE);
                    
                    cache.put(request, networkResponse.clone());
                    console.log('Cached from network:', request.url);
                }
                
                return networkResponse;
            } catch (error) {
                console.log('Network failed for:', request.url);
                
                // Network failed, return appropriate fallback
                if (url.pathname.includes('/guidelines/') && url.pathname.endsWith('.html')) {
                    return new Response(`
                        <div style="padding: 2rem; text-align: center; background: #f5f5f5; margin: 1rem; border-radius: 8px;">
                            <h2>Unable to Load</h2>
                            <p>This guideline could not be loaded.</p>
                            <button onclick="window.history.back()" style="background: rgb(72, 160, 219); color: white; border: none; padding: 1rem 2rem; border-radius: 4px; cursor: pointer;">← Back to Guidelines</button>
                        </div>
                    `, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
                
                // For navigation requests, return the main page
                if (request.destination === 'document') {
                    const cachedIndex = await caches.match('/itc/index.html');
                    if (cachedIndex) {
                        return cachedIndex;
                    }
                }
                
                return new Response('Offline', { status: 503 });
            }
        })()
    );
});

console.log('Service Worker loaded');