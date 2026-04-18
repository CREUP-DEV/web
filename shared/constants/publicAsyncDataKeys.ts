/**
 * Stable `useFetch` / `useAsyncData` keys for public CMS payloads.
 * Use with `refreshNuxtData(key)` after admin mutations so SPA navigation picks up fresh data.
 */
export const PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY = 'public-about-page'

export const getPublicHomeDataAsyncDataKey = (locale: string) => `home-data-${locale}`
