import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { getQuery, setHeader } from 'h3'
import { getRequestLocaleContext } from '../locale/requestLocale'

interface PublicRouteCacheKeyOptions {
  includeLocale?: boolean
  queryKeys?: string[]
  /** Extra request-derived parts (e.g. a route param) that select a distinct cached response. */
  keyParts?: (event: H3Event) => string[]
}

/**
 * Scopes of the public handlers whose payload admins can change. Each one is the handler's Nitro
 * cache `name`, so its entries live under `nitro:handlers:<scope>:` in the `cache` storage and
 * `server/utils/admin/adminCacheInvalidation.ts` purges exactly that prefix. Sharing the constant
 * is what keeps the two from drifting apart again.
 */
export const PUBLIC_CMS_CACHE_SCOPES = {
  aboutPage: 'about-page',
  activity: 'public-activity',
  activityDetail: 'public-activity-detail',
  areaReports: 'public-area-reports',
  areaReportsMonths: 'public-area-reports-months',
  equalityDocuments: 'public-equality-documents',
  financialReports: 'public-financial-reports',
  home: 'public-home',
  press: 'public-press',
  pressDetail: 'public-press-detail',
  pressDossier: 'press-dossier',
  tags: 'public-tags',
} as const

export type PublicCmsCacheScope =
  (typeof PUBLIC_CMS_CACHE_SCOPES)[keyof typeof PUBLIC_CMS_CACHE_SCOPES]

interface PublicApiCacheHeaderOptions {
  browserMaxAgeSeconds?: number
  sharedMaxAgeSeconds?: number
  staleWhileRevalidateSeconds?: number
}

const DEFAULT_PUBLIC_API_BROWSER_MAX_AGE_SECONDS = 0
const DEFAULT_PUBLIC_API_SHARED_MAX_AGE_SECONDS = 5
const DEFAULT_PUBLIC_API_STALE_WHILE_REVALIDATE_SECONDS = 5

export function setPublicRouteVaryHeaders(event: H3Event) {
  // x-request-locale is the only locale source for API requests (see
  // server/middleware/locale.ts), so it is the only header the shared cache must
  // vary on. Adding cookie/accept-language here would fragment the cache instead.
  setHeader(event, 'vary', 'x-request-locale')
}

export function setPublicApiCacheHeaders(
  event: H3Event,
  options: PublicApiCacheHeaderOptions = {}
) {
  const browserMaxAgeSeconds = Math.max(
    0,
    options.browserMaxAgeSeconds ?? DEFAULT_PUBLIC_API_BROWSER_MAX_AGE_SECONDS
  )
  const sharedMaxAgeSeconds = Math.max(
    0,
    options.sharedMaxAgeSeconds ?? DEFAULT_PUBLIC_API_SHARED_MAX_AGE_SECONDS
  )
  const staleWhileRevalidateSeconds = Math.max(
    0,
    options.staleWhileRevalidateSeconds ?? DEFAULT_PUBLIC_API_STALE_WHILE_REVALIDATE_SECONDS
  )

  setHeader(
    event,
    'cache-control',
    `public, max-age=${browserMaxAgeSeconds}, s-maxage=${sharedMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
  )
}

export const PUBLIC_ROUTE_CACHE_OPTIONS = {
  base: 'cache',
  maxAge: 300,
  swr: true,
} as const

export const FAST_EXTERNAL_ROUTE_CACHE_OPTIONS = {
  base: 'cache',
  maxAge: 5,
  swr: true,
} as const

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(',')
  }

  if (value == null) {
    return ''
  }

  return String(value)
}

/**
 * Nitro runs a custom cache key through `escapeKey`, which strips every non-word character, so
 * `a-b` and `ab` (or `offset=10` and `offset=1.0`) would share an entry. Hashing the parts keeps
 * the key word-only and collision-free; the locale stays readable in front for debugging.
 */
function buildPublicRouteCacheKey(event: H3Event, options: PublicRouteCacheKeyOptions) {
  const locale = options.includeLocale === false ? 'all' : getRequestLocaleContext(event).locale
  const query = getQuery(event)
  const parts = [
    ...(options.keyParts?.(event) ?? []),
    ...(options.queryKeys ?? []).map((key) => `${key}=${normalizeQueryValue(query[key])}`),
  ]

  if (parts.length === 0) {
    return locale
  }

  const digest = createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32)
  return `${locale}_${digest}`
}

/**
 * Cache options for a public `defineCachedEventHandler`. `scope` becomes the Nitro cache `name`
 * (names, unlike keys, are not escaped), which is what lets admin mutations purge it by prefix.
 */
export function publicRouteCacheOptions(
  scope: string,
  keyOptions: PublicRouteCacheKeyOptions = {},
  baseOptions:
    | typeof PUBLIC_ROUTE_CACHE_OPTIONS
    | typeof FAST_EXTERNAL_ROUTE_CACHE_OPTIONS = PUBLIC_ROUTE_CACHE_OPTIONS
) {
  return {
    ...baseOptions,
    name: scope,
    getKey: (event: H3Event) => buildPublicRouteCacheKey(event, keyOptions),
  }
}
