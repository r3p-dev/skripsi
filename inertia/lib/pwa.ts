/**
 * Registers the service worker that backs the installed app.
 *
 * Only in a production build. In development the assets are served by Vite on
 * its own port with no hashed filenames, so a worker caching `/assets/*` would
 * hand back yesterday's bundle and make every HMR update look broken.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  /**
   * Registration competes with the page's own requests for bandwidth, so it
   * waits until the first paint is paid for. The entry script is deferred,
   * which normally puts us before `load` — the readyState check covers the
   * case where a slow bundle arrives after it.
   */
  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.error('Service worker registration failed', error))
  }

  if (document.readyState === 'complete') {
    register()
  } else {
    window.addEventListener('load', register, { once: true })
  }
}
