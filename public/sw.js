const CACHE_NAME = "megh-drishti-cache-v1"
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/icon-maskable-192x192.png",
  "/icon-maskable-512x512.png",
  "/data/demo/amphan_replay.json",
  "/data/demo/anomalies.json",
  "/data/demo/tracks.json",
  "/data/demo/downscaled.json",
  "/data/demo/alerts.json",
  "/data/demo/metrics.json",
]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[SW] Pre-cache partial warning:", err)
      })
    })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle navigation requests (SPA root)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          const matched = await cache.match("/")
          return matched || new Response("Offline - Megh Drishti", { headers: { "Content-Type": "text/html" } })
        })
    )
    return
  }

  // Handle local demo data and assets (Cache first, falling back to network)
  if (url.origin === location.origin) {
    if (url.pathname.startsWith("/data/demo/") || url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|svg|jpg|jpeg|webp|ico|woff2?)$/)) {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            if (response.status === 200) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            }
            return response
          }).catch(() => cached)
        })
      )
      return
    }
  }

  // Network-first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && request.method === "GET") {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
