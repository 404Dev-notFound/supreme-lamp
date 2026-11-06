/**
 * flowCTRL Enterprise Service Worker (Cache API Layer)
 * 
 * Provides:
 * - Offline shell resilience
 * - Cache-first strategy for static bundles, fonts, icons, images
 * - Stale-while-revalidate for public API catalogs
 * - Transparent bypass for authenticated mutations and private user data
 */

const CACHE_VERSION = "flowctrl-v1.6.3";
const STATIC_CACHE_NAME = `flowctrl-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `flowctrl-api-${CACHE_VERSION}`;

// Pre-cached assets during service worker install
const PRECACHE_ASSETS = [
  "/",
  "/roadmaps",
  "/dsa",
  "/project-tutorials",
  "/resources",
  "/favicon.ico",
];

// 1. Install Event: Cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((asset) =>
            cache.add(asset).catch((err) => {
              console.warn(`[SW] Precache skipped: ${asset}`, err.message);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("SW install precache warning:", err))
  );
});

// 2. Activate Event: Clean up outdated cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== STATIC_CACHE_NAME && name !== API_CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent multi-strategy routing
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strictly skip non-GET requests, Chrome extensions, and authentication mutations
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Never cache sensitive authentication routes
  if (
    url.pathname.includes("/api/auth/") ||
    url.pathname.includes("/api/users/me") ||
    url.pathname.includes("/api/security/")
  ) {
    return;
  }

  // Strategy A: Static Assets (Next.js chunks, fonts, images, styles) -> Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(woff2?|ttf|eot|png|jpg|jpeg|svg|webp|ico|css|js)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // Strategy B: Public API Catalog GET endpoints -> Stale-While-Revalidate
  if (
    url.pathname.startsWith("/api/roadmaps") ||
    url.pathname.startsWith("/api/dsa") ||
    url.pathname.startsWith("/api/project-tutorials") ||
    url.pathname.startsWith("/api/resources") ||
    url.pathname.startsWith("/api/announcements")
  ) {
    // Explicit conditional validation passes through to origin
    if (request.headers.has("If-None-Match")) {
      event.respondWith(
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
      );
      return;
    }

    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              if (cachedResponse) return cachedResponse;
              return new Response(
                JSON.stringify({
                  success: false,
                  offline: true,
                  error: "Network unavailable and resource not in offline cache.",
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              );
            });

          // Return cached response instantly if present; else wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy C: HTML Page Navigations -> Network First with App Shell Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return (
              cachedResponse ||
              caches.match("/") ||
              new Response(
                "<!DOCTYPE html><html><head><title>flowCTRL - Offline</title></head><body style='background:#09090b;color:#f4f4f5;font-family:sans-serif;padding:3rem;text-align:center;'><h1>Offline Mode</h1><p>You are currently offline. Previously cached sections remain accessible.</p><button onclick='window.location.reload()' style='background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;'>Retry</button></body></html>",
                { headers: { "Content-Type": "text/html" } }
              )
            );
          });
        })
    );
    return;
  }
});

