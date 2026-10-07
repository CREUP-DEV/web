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
 * Wayback toolbar, and both are in the document before any module script runs. The `archived:`
 * CSS variant (main.css) keys on the same two signals to swap in the header's no-JS menu.
 */
function isWebArchiveReplay() {
  return Boolean(document.querySelector('script[src*="/wombat.js"], #wm-ipp-base'))
}

/** @nuxtjs/color-mode's default key; its inline head script reads it back on every capture. */
const COLOR_MODE_STORAGE_KEY = 'nuxt-color-mode'

/**
 * The colour mode button is the one header control a native element cannot stand in for, so it
 * gets a plain listener here. The Wayback Machine leaves localStorage alone, which lets the choice
 * carry over to the next capture the visitor opens.
 */
function wireColorModeToggles() {
  const root = document.documentElement

  for (const button of document.querySelectorAll<HTMLElement>('[data-color-mode-toggle]')) {
    // The server rendered a label for whichever mode it assumed, so it may already be wrong.
    if (button.dataset.archiveLabel) {
      button.setAttribute('aria-label', button.dataset.archiveLabel)
    }

    button.addEventListener('click', () => {
      const dark = !root.classList.contains('dark')
      root.classList.toggle('dark', dark)
      root.classList.toggle('light', !dark)

      try {
        localStorage.setItem(COLOR_MODE_STORAGE_KEY, dark ? 'dark' : 'light')
      } catch {
        // Storage can be unavailable (private mode, blocked by the archive); the switch still
        // applies to this page.
      }
    })
  }
}

export default defineNuxtPlugin({
  name: 'web-archive-replay',
  // Ahead of every other plugin, Nuxt's own included (the lowest is -30): those are the ones that
  // would fetch the pieces the archive never stored.
  order: -100,
  setup() {
    if (isWebArchiveReplay()) {
      wireColorModeToggles()
      // Never settles, so the plugin chain stops here and the app is never mounted.
      return new Promise<void>(() => {})
    }
  },
})
