/*
 * Hospio360 service worker (docs/pwa.md). Hand-written and deliberately small.
 *
 * What it does:
 *   - Page loads (navigations) always go to the network. Only when the network is unreachable does it answer with the
 *     offline page. Pages are never stored: they carry the signed-in person's data.
 *   - Build files under /_next/static/ (hashed, the same for everyone) and the app icons are kept in a cache named after
 *     the build, so an installed app opens faster. A new deploy registers this file with a new ?v= and the old caches
 *     are deleted when it takes over.
 *
 * What it never touches (the browser handles them exactly as without a service worker):
 *   - anything that is not a GET: server actions, sign-in, uploads;
 *   - /api/* (session refresh, version check, downloads, lookups) and every other origin (the Hospio API);
 *   - Next's in-app page data (RSC requests) and anything else that is not a navigation or a static build file.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = `hospio-shell-${VERSION}`;
const OFFLINE = "/offline.html";
const PRECACHE = [OFFLINE, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" })));
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(names.filter((n) => n.startsWith("hospio-") && n !== CACHE).map((n) => caches.delete(n)));
			if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
			await self.clients.claim();
		})(),
	);
});

/** Network first, nothing stored; the offline page only when the network cannot be reached at all. */
async function navigate(event) {
	try {
		const preloaded = await event.preloadResponse;
		if (preloaded) return preloaded;
		return await fetch(event.request);
	} catch {
		const offline = await caches.match(OFFLINE, { cacheName: CACHE });
		return offline || Response.error();
	}
}

/** Hashed build files never change under the same URL: cache first, stored only when the answer is a clean 200. */
async function staticFile(request) {
	const cache = await caches.open(CACHE);
	const hit = await cache.match(request);
	if (hit) return hit;
	const res = await fetch(request);
	if (res.ok && res.type === "basic") cache.put(request, res.clone()).catch(() => {});
	return res;
}

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;
	if (url.pathname.startsWith("/api/")) return;
	if (request.mode === "navigate") {
		event.respondWith(navigate(event));
		return;
	}
	// RSC page data shares page URLs; it is never a static build file, but keep it out explicitly.
	if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;
	if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
		event.respondWith(staticFile(request));
	}
});
