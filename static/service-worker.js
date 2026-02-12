/**
 * Service Worker for No Vacancies
 * Keeps app shell + core static assets available for offline play.
 */

const CACHE_NAME = 'sydney-story-v4-sveltekit';
const ASSETS_TO_CACHE = [
	'/',
	'/play',
	'/settings',
	'/ending',
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

async function cacheCoreAssets(cache) {
	const results = await Promise.allSettled(
		ASSETS_TO_CACHE.map(async (assetPath) => {
			const response = await fetch(assetPath, { cache: 'no-cache' });
			if (!response.ok) {
				throw new Error(`${assetPath} (${response.status})`);
			}
			await cache.put(assetPath, response.clone());
		})
	);

	const failed = results
		.map((result, index) => ({ result, assetPath: ASSETS_TO_CACHE[index] }))
		.filter(({ result }) => result.status === 'rejected')
		.map(({ assetPath, result }) => `${assetPath}: ${result.reason}`);

	if (failed.length > 0) {
		console.warn('[SW] Some assets were not cached during install:', failed);
	}
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cacheCoreAssets(cache))
			.then(() => self.skipWaiting())
			.catch((error) => {
				console.error('[SW] Cache failed:', error);
			})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((name) => name !== CACHE_NAME)
						.map((name) => caches.delete(name))
				)
			)
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const requestUrl = new URL(event.request.url);
	if (requestUrl.origin !== self.location.origin) return;

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request)
				.then((response) => {
					if (!response || response.status !== 200 || response.type === 'opaque') {
						return response;
					}

					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				})
				.catch(() => {
					if (event.request.mode === 'navigate') {
						return caches.match('/');
					}
					return null;
				});
		})
	);
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
