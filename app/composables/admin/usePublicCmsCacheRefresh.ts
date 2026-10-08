import { clearNuxtData, refreshNuxtData } from '#app'
import {
  getPublicHomeAsyncDataKey,
  isPublicCmsAsyncDataKey,
  PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
} from '~~/shared/constants/publicAsyncDataKeys'
import { invalidatePublicCmsCache } from '@/utils/publicCmsCachedData'

/**
 * Refreshes client-side Nuxt data caches after admin saves so public pages do not show stale
 * content when navigating via SPA (server Nitro cache is already invalidated separately). Each
 * function also expires the public reads cached in the site's other open tabs, which refetch the
 * ones on screen (`invalidatePublicCmsCache`).
 */
export function usePublicCmsCacheRefresh() {
  const { locales } = useI18n()
  const nuxtApp = useNuxtApp()

  const getCachedPublicCmsKeys = () =>
    Array.from(
      new Set([...Object.keys(nuxtApp.payload.data), ...Object.keys(nuxtApp._asyncData)])
    ).filter(isPublicCmsAsyncDataKey)

  async function refreshAboutPage() {
    if (import.meta.server) {
      return
    }

    invalidatePublicCmsCache()
    clearNuxtData(PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY)
    await refreshNuxtData(PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY)
  }

  async function refreshHomeData() {
    if (import.meta.server) {
      return
    }

    invalidatePublicCmsCache()
    const keys = locales.value.map((l) => getPublicHomeAsyncDataKey(l.code))
    clearNuxtData(keys)
    await refreshNuxtData(keys)
  }

  /**
   * Refetches every public CMS `useAsyncData` / `useFetch` entry. Use sparingly when many public
   * lists depend on a change (e.g. site-wide default images).
   */
  async function refreshAllClientAsyncData() {
    if (import.meta.server) {
      return
    }

    // Invalidate every cached public read so the next navigation to any public page refetches,
    // even pages not currently in the client data cache.
    invalidatePublicCmsCache()

    const keys = getCachedPublicCmsKeys()

    if (keys.length === 0) {
      return
    }

    clearNuxtData(keys)
    await refreshNuxtData(keys)
  }

  return {
    refreshAboutPage,
    refreshHomeData,
    refreshAllClientAsyncData,
  }
}
