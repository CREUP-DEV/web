/**
 * Composable for managing cookie consent state.
 *
 * Persists the user's consent choice in a cookie so it is available
 * both client-side and server-side.  Essential cookies are always
 * allowed; optional categories (e.g. analytics) can be individually
 * accepted or rejected.
 *
 * The composable also drives the cookie-consent banner and the
 * settings modal through shared reactive state.
 *
 * Usage:
 *   const { hasConsented, isAnalyticsAccepted, acceptAll, ... } = useCookieConsent()
 *   if (isAnalyticsAccepted.value) { // enable analytics }
 */

/** Categories that can be toggled by the user. */
export type CookieCategory = 'analytics'

interface CookieConsentState {
  /** Timestamp (ISO) when the user gave / updated consent. */
  consentedAt: string
  /** Categories explicitly accepted by the user. */
  accepted: CookieCategory[]
}

const COOKIE_NAME = 'cookie-consent'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

/** Whether the settings modal is currently open. */
const showSettings = ref(false)

export function useCookieConsent() {
  const consent = useCookie<CookieConsentState | null>(COOKIE_NAME, {
    default: () => null,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })

  /** Whether the user has already made a consent choice. */
  const hasConsented = computed(() => consent.value !== null)

  /** Reactive flag for analytics acceptance — use in watchers / templates. */
  const isAnalyticsAccepted = computed(() => consent.value?.accepted.includes('analytics') ?? false)

  /** Whether a specific optional category has been accepted. */
  function isAccepted(category: CookieCategory): boolean {
    return consent.value?.accepted.includes(category) ?? false
  }

  /** Persist a consent choice with the given categories. */
  function _save(accepted: CookieCategory[]) {
    consent.value = {
      consentedAt: new Date().toISOString(),
      accepted,
    }
    showSettings.value = false
  }

  /** Accept all cookie categories (essential + optional). */
  function acceptAll() {
    _save(['analytics'] satisfies CookieCategory[])
  }

  /** Accept only essential cookies (reject all optional categories). */
  function acceptEssentialOnly() {
    _save([])
  }

  /** Save a specific set of accepted categories (from settings modal). */
  function savePreferences(categories: CookieCategory[]) {
    _save(categories)
  }

  /** Reset consent so the banner shows again. */
  function resetConsent() {
    consent.value = null
  }

  /** Open the settings modal so the user can edit preferences. */
  function openSettings() {
    showSettings.value = true
  }

  /** Close the settings modal without saving. */
  function closeSettings() {
    showSettings.value = false
  }

  return {
    hasConsented,
    isAnalyticsAccepted,
    isAccepted,
    acceptAll,
    acceptEssentialOnly,
    savePreferences,
    resetConsent,
    showSettings,
    openSettings,
    closeSettings,
  }
}
