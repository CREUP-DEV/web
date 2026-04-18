import { refreshNuxtData } from '#app'
import {
  getPublicHomeDataAsyncDataKey,
  PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
} from '~~/shared/constants/publicAsyncDataKeys'

/**
 * Refreshes client-side Nuxt data caches after admin saves so public pages do not show stale
 * content when navigating via SPA (server Nitro cache is already invalidated separately).
 */
export function usePublicCmsCacheRefresh() {
  const { locales } = useI18n()

  async function refreshAboutPage() {
    if (import.meta.server) {
      return
    }

    await refreshNuxtData(PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY)
  }

  async function refreshHomeData() {
    if (import.meta.server) {
      return
    }

    const keys = locales.value.map((l) => getPublicHomeDataAsyncDataKey(l.code))
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

    await refreshNuxtData()
  }

  return {
    refreshAboutPage,
    refreshHomeData,
    refreshAllClientAsyncData,
  }
}
