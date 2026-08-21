const STATIC_CACHE = "sedekah-je-static-v1";
const PAGE_CACHE = "sedekah-je-pages-v1";
const OFFLINE_URL = "/offline";
const STATIC_PATH_PREFIXES = ["/_next/static/", "/icons/", "/images/"];
const STATIC_FILES = new Set([
	OFFLINE_URL,
	"/favicon.ico",
	"/pwa-64x64.png",
	"/pwa-192x192.png",
	"/pwa-512x512.png",
	"/maskable-icon-512x512.png",
	"/apple-touch-icon-180x180.png",
]);
const BLOCKED_NAVIGATION_PREFIXES = [
	"/admin",
	"/api",
	"/auth",
	"/contribute",
	"/leaderboard",
	"/my-contributions",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(STATIC_CACHE).then((cache) => cache.addAll([...STATIC_FILES])),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter(
						(cacheName) =>
							cacheName !== STATIC_CACHE && cacheName !== PAGE_CACHE,
					)
					.map((cacheName) => caches.delete(cacheName)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (request.method !== "GET") {
		return;
	}

	const url = new URL(request.url);

	if (url.origin !== self.location.origin) {
		return;
	}

	if (shouldBypassRequest(url)) {
		return;
	}

	if (request.mode === "navigate") {
		if (isBlockedNavigation(url.pathname)) {
			return;
		}

		event.respondWith(handleNavigationRequest(request));
		return;
	}

	if (shouldCacheStaticAsset(url.pathname)) {
		event.respondWith(handleStaticAssetRequest(request));
	}
});

async function handleNavigationRequest(request) {
	try {
		const response = await fetch(request);

		if (response?.ok) {
			const cache = await caches.open(PAGE_CACHE);
			cache.put(request, response.clone());
		}

		return response;
	} catch {
		const cachedResponse = await caches.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}

		const offlineResponse = await caches.match(OFFLINE_URL);
		if (offlineResponse) {
			return offlineResponse;
		}

		return Response.error();
	}
}

async function handleStaticAssetRequest(request) {
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	const response = await fetch(request);
	if (!response || response.status !== 200) {
		return response;
	}

	const cache = await caches.open(STATIC_CACHE);
	cache.put(request, response.clone());
	return response;
}

function shouldBypassRequest(url) {
	return (
		url.pathname.startsWith("/_next/image") ||
		url.pathname.startsWith("/api/") ||
		url.pathname.startsWith("/api/auth/")
	);
}

function isBlockedNavigation(pathname) {
	return BLOCKED_NAVIGATION_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

function shouldCacheStaticAsset(pathname) {
	if (STATIC_FILES.has(pathname)) {
		return true;
	}

	if (STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
		return true;
	}

	return /\.(?:css|js|mjs|png|svg|jpg|jpeg|gif|webp|avif|ico|woff2?)$/i.test(
		pathname,
	);
}
