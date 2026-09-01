/**
 * Stable `useFetch` / `useAsyncData` keys for public CMS payloads.
 * Use with `refreshNuxtData(key)` after admin mutations so SPA navigation picks up fresh data.
 */
export const PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY = 'public-about-page'
export const PUBLIC_PRESS_DOSSIER_ASYNC_DATA_KEY = 'public-layout-press-dossier-link'
export const PUBLIC_EQUALITY_DOCUMENTS_ASYNC_DATA_KEY_PREFIX = 'public-equality-documents'
export const PUBLIC_FINANCIAL_REPORTS_ASYNC_DATA_KEY_PREFIX = 'public-financial-reports'

export const getPublicHomeAsyncDataKey = (locale: string) => `home-${locale}`
export const getPublicEqualityDocumentsAsyncDataKey = (locale: string, offset: number) =>
  `${PUBLIC_EQUALITY_DOCUMENTS_ASYNC_DATA_KEY_PREFIX}-${locale}-${offset}`
export const getPublicFinancialReportsAsyncDataKey = (locale: string, offset: number) =>
  `${PUBLIC_FINANCIAL_REPORTS_ASYNC_DATA_KEY_PREFIX}-${locale}-${offset}`

export const PUBLIC_CMS_ASYNC_DATA_KEY_PREFIXES = [
  PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
  PUBLIC_PRESS_DOSSIER_ASYNC_DATA_KEY,
  PUBLIC_EQUALITY_DOCUMENTS_ASYNC_DATA_KEY_PREFIX,
  PUBLIC_FINANCIAL_REPORTS_ASYNC_DATA_KEY_PREFIX,
  'home-',
  'press-',
  'press-article-',
  'tags-',
] as const
