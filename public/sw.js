/// <reference lib="webworker" />

/**
 * The service worker that makes UmimaClean installable and gives it something
 * to show when the phone drops off the network — a courier standing in a
 * basement car park is the normal case here, not the edge case.
 *
 * It is deliberately hand written rather than generated. Every page in this
 * app is either private (orders, addresses, trips) or a live view of state that
 * changes while you look at it, so the one thing a precache-everything setup
 * would give us — instant offline pages — is the one thing we must not do. The
 * rules below only ever cache things that are safe to hand to a different
 * person on the same device: build assets, icons, and a static offline page.
 *
 * Bump CACHE_VERSION whenever the shell files below change; the activate step
 * throws away every cache that does not carry the current version.
 */

const CACHE_VERSION = 'v2'
const SHELL_CACHE = `umimaclean-shell-${CACHE_VERSION}`
const ASSET_CACHE = `umimaclean-assets-${CACHE_VERSION}`
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE]

const OFFLINE_URL = '/offline.html'

/**
 * Everything needed to render the offline page without touching the network.
 * It has no stylesheet of its own — the CSS is inline — so this list stays
 * short on purpose.
 */
const SHELL_FILES = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/web-app-manifest-192x192.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await cache.addAll(SHELL_FILES)

      /**
       * A waiting worker would only take over after every tab is closed, and
       * an installed app is rarely closed. Since nothing here caches HTML,
       * taking over immediately cannot show a user a stale page.
       */
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

/**
 * Hashed build output from Vite. The filename changes whenever the contents
 * change, so a hit can be served from the cache forever without a revalidation
 * round trip.
 */
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

/**
 * Icons and images keep their filenames across deploys, so they are served
 * from the cache for speed and refreshed in the background for correctness.
 */
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

/**
 * Full page loads. Always from the network, because the HTML carries the
 * logged-in user's data inside the Inertia payload; the cache is only ever
 * consulted to explain that the phone is offline.
 */
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

  /**
   * Anything that changes state on the server is none of this worker's
   * business, and neither is another origin — Midtrans' payment popup and the
   * OpenStreetMap tiles both answer for themselves.
   */
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

  /**
   * Everything else falls through to the network untouched: Inertia's XHR
   * visits, the transmit event stream that drives the live order feed, uploaded
   * inspection photos, and the spreadsheet exports. None of them should ever be
   * answered from a cache.
   */
})
