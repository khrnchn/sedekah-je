const CACHE_NAME = "sedekah-je-v1";
const urlsToCache = [
	"/",
	"/offline",
	"/manifest.json",
	"/icon-192x192.png",
	"/icon-512x512.png",
];

// Install service worker
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
	);
});

// Fetch event
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches
			.match(event.request)
			.then((response) => {
				// Return cached version or fetch from network
				return response || fetch(event.request);
			})
			.catch(() => {
				// If both cache and network fail, show offline page
				if (event.request.destination === "document") {
					return caches.match("/offline");
				}
			}),
	);
});

// Update service worker
self.addEventListener("activate", (event) => {
	const cacheWhitelist = [CACHE_NAME];
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				}),
			);
		}),
	);
});
