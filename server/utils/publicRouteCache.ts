import type { H3Event } from 'h3'
import { getQuery, setHeader } from 'h3'
import { getRequestLocaleContext } from './requestLocale'

interface PublicRouteCacheKeyOptions {
  includeLocale?: boolean
  queryKeys?: string[]
}

interface PublicApiCacheHeaderOptions {
  browserMaxAgeSeconds?: number
  sharedMaxAgeSeconds?: number
  staleWhileRevalidateSeconds?: number
}

const DEFAULT_PUBLIC_API_BROWSER_MAX_AGE_SECONDS = 0
const DEFAULT_PUBLIC_API_SHARED_MAX_AGE_SECONDS = 5
const DEFAULT_PUBLIC_API_STALE_WHILE_REVALIDATE_SECONDS = 5

export function setPublicRouteVaryHeaders(event: H3Event) {
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

const normalizeQueryValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(',')
  }

  if (value == null) {
    return ''
  }

  return String(value)
}

export function buildPublicRouteCacheKey(
  event: H3Event,
  scope: string,
  options: PublicRouteCacheKeyOptions = {}
) {
  const keySegments = [scope]

  if (options.includeLocale !== false) {
    keySegments.push(`locale=${getRequestLocaleContext(event).locale}`)
  }

  const query = getQuery(event)
  for (const key of options.queryKeys ?? []) {
    keySegments.push(`${key}=${normalizeQueryValue(query[key])}`)
  }

  return keySegments.join(':')
}
