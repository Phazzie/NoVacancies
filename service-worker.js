/**
 * Service Worker for No Vacancies
 * Enables offline play by caching all static assets
 */

const CACHE_NAME = 'sydney-story-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/js/app.js',
    '/js/contracts.js',
    '/js/lessons.js',
    '/js/prompts.js',
    '/js/renderer.js',
    '/js/services/mockStoryService.js',
    '/js/services/geminiStoryService.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/images/hotel_room.png',
    '/images/sydney_laptop.png',
    '/images/sydney_thinking.png',
    '/images/sydney_frustrated.png',
    '/images/sydney_tired.png',
    '/images/sydney_phone_anxious.png',
    '/images/sydney_coffee_morning.png',
    '/images/sydney_window_dawn.png',
    '/images/oswaldo_sleeping.png',
    '/images/oswaldo_awake.png',
    '/images/the_door.png',
    '/images/empty_room.png',
    '/images/motel_exterior.png',
    '/images/car_memory.png',
    '/images/convenience_store.png',
    '/images/sydney_oswaldo_tension.png',
    '/images/trina_crashed.png'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] Install complete');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activate complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('generativelanguage.googleapis.com')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache dynamically fetched content
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        return null;
                    });
            })
    );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
