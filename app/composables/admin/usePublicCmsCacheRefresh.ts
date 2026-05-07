import { clearNuxtData, refreshNuxtData } from '#app'
import {
  PUBLIC_CMS_ASYNC_DATA_KEY_PREFIXES,
  getPublicHomeAsyncDataKey,
  PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
} from '~~/shared/constants/publicAsyncDataKeys'

/**
 * Refreshes client-side Nuxt data caches after admin saves so public pages do not show stale
 * content when navigating via SPA (server Nitro cache is already invalidated separately).
 */
export function usePublicCmsCacheRefresh() {
  const { locales } = useI18n()
  const nuxtApp = useNuxtApp()

  const getCachedPublicCmsKeys = () =>
    Array.from(
      new Set([...Object.keys(nuxtApp.payload.data), ...Object.keys(nuxtApp._asyncData)])
    ).filter((key) => PUBLIC_CMS_ASYNC_DATA_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))

  async function refreshAboutPage() {
    if (import.meta.server) {
      return
    }

    clearNuxtData(PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY)
    await refreshNuxtData(PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY)
  }

  async function refreshHomeData() {
    if (import.meta.server) {
      return
    }

    const keys = locales.value.map((l) => getPublicHomeAsyncDataKey(l.code))
    clearNuxtData(keys)
    await refreshNuxtData(keys)
  }

  /**
   * Refetches every `useAsyncData` / `useFetch` entry. Use sparingly when many public lists depend
   * on a change (e.g. site-wide default images).
   */
  async function refreshAllClientAsyncData() {
    if (import.meta.server) {
      return
    }

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
