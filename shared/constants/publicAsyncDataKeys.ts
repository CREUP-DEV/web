/**
 * Stable `useFetch` / `useAsyncData` keys for public CMS payloads.
 * Use with `refreshNuxtData(key)` after admin mutations so SPA navigation picks up fresh data. A read
 * that uses `publicCmsCachedData` under a key outside these prefixes still expires on admin saves,
 * but is never refetched while on screen.
 */
export const PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY = 'public-about-page'
export const PUBLIC_EQUALITY_DOCUMENTS_ASYNC_DATA_KEY_PREFIX = 'public-equality-documents'
export const PUBLIC_FINANCIAL_REPORTS_ASYNC_DATA_KEY_PREFIX = 'public-financial-reports'
export const PUBLIC_PRESS_KIT_ASYNC_DATA_KEY_PREFIX = 'public-press-kit'

export const getPublicHomeAsyncDataKey = (locale: string) => `home-${locale}`
export const getPublicEqualityDocumentsAsyncDataKey = (locale: string, offset: number) =>
  `${PUBLIC_EQUALITY_DOCUMENTS_ASYNC_DATA_KEY_PREFIX}-${locale}-${offset}`
export const getPublicFinancialReportsAsyncDataKey = (locale: string, offset: number) =>
  `${PUBLIC_FINANCIAL_REPORTS_ASYNC_DATA_KEY_PREFIX}-${locale}-${offset}`
export const getPublicPressKitAsyncDataKey = (part: string) =>
  `${PUBLIC_PRESS_KIT_ASYNC_DATA_KEY_PREFIX}-${part}`

export const PUBLIC_CMS_ASYNC_DATA_KEY_PREFIXES = [
  PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
  PUBLIC_EQUALITY_DOCUMENTS_ASYNC_DATA_KEY_PREFIX,
  PUBLIC_FINANCIAL_REPORTS_ASYNC_DATA_KEY_PREFIX,
  PUBLIC_PRESS_KIT_ASYNC_DATA_KEY_PREFIX,
  'activity-',
  'area-reports-',
  'home-',
  'press-',
  'press-article-',
  'tags-',
] as const

export const isPublicCmsAsyncDataKey = (key: string) =>
  PUBLIC_CMS_ASYNC_DATA_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
