/**
 * Web archives (the Wayback Machine, and the pywb-based ones national libraries run) store the
 * server-rendered HTML, which already holds the whole page, but not what the app fetches once it
 * boots: the extracted payload, the i18n messages, chunks imported on demand, API calls. Booting
 * inside a replay swaps the archived content for the error page with raw i18n keys, so there the
 * app is never mounted and the page stays as the server rendered it, navigable through the
 * archive's own links between captures.
 *
 * Detected from the DOM rather than `window` or `location`: the replay rewrites scripts so both
 * resolve to proxies of the original site, but it cannot hide its own wombat.js script tag or the
 * Wayback toolbar, and both are in the document before any module script runs.
 */
function isWebArchiveReplay() {
  return Boolean(document.querySelector('script[src*="/wombat.js"], #wm-ipp-base'))
}

export default defineNuxtPlugin({
  name: 'web-archive-replay',
  // Ahead of every other plugin, Nuxt's own included (the lowest is -30): those are the ones that
  // would fetch the pieces the archive never stored.
  order: -100,
  setup() {
    if (isWebArchiveReplay()) {
      // Never settles, so the plugin chain stops here and the app is never mounted.
      return new Promise<void>(() => {})
    }
  },
})
