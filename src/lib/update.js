/* global __BUILD_ID__ */

/**
 * GitHub Pages serves index.html with max-age=600, and iOS home-screen apps hold on to it
 * even longer, so a fresh deploy can stay invisible. On launch and whenever the app comes
 * back to the foreground, ask for version.json without cache; if it names a newer build,
 * reload through a URL the cache has never seen.
 */
export function watchForUpdates() {
  if (import.meta.env.DEV) return
  const base = import.meta.env.BASE_URL

  async function check() {
    try {
      const res = await fetch(`${base}version.json?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) return
      const { version } = await res.json()
      if (!version || version === __BUILD_ID__) return
      // One attempt per version, so a stale CDN edge can never cause a reload loop
      const key = `reloadedFor:${version}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      location.replace(`${location.pathname}?v=${version}${location.hash}`)
    } catch { /* offline: keep running the current version */ }
  }

  check()
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check() })
}
