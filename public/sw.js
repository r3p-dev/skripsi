/// <reference lib="webworker" />

const CACHE_VERSION = 'v2'
const SHELL_CACHE = `umimaclean-shell-${CACHE_VERSION}`
const ASSET_CACHE = `umimaclean-assets-${CACHE_VERSION}`
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE]

const OFFLINE_URL = '/offline.html'

const SHELL_FILES = [OFFLINE_URL, '/manifest.webmanifest', '/icons/web-app-manifest-192x192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await cache.addAll(SHELL_FILES)

      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('umimaclean-') && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      )

      await self.clients.claim()
    })()
  )
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    cache.put(request, response.clone())
  }

  return response
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => undefined)

  return cached ?? (await network) ?? Response.error()
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request)
  } catch {
    const cache = await caches.open(SHELL_CACHE)
    const offline = await cache.match(OFFLINE_URL)
    return (
      offline ??
      new Response('Anda sedang offline.', {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    )
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/')) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE))
    return
  }
})
