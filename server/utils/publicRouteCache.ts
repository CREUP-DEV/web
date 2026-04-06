import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { getRequestLocaleContext } from './requestLocale'

interface PublicRouteCacheKeyOptions {
  includeLocale?: boolean
  queryKeys?: string[]
}

export const PUBLIC_ROUTE_CACHE_OPTIONS = {
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
