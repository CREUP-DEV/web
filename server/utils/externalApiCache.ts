import type { H3Event } from 'h3'
import { setHeader } from 'h3'

export interface ExternalApiCacheOptions {
  maxAgeSeconds: number
  staleSeconds: number
}

interface CacheEntry<T> {
  value: T | null
  freshUntil: number
  staleUntil: number
  updatedAt: number
  pending?: Promise<T>
}

const cacheStore = new Map<string, CacheEntry<unknown>>()
const MAX_CACHE_ENTRIES = 500
const DEFAULT_MAX_AGE_SECONDS = 300
const DEFAULT_STALE_SECONDS = 900

const parsePositiveInt = (value: unknown, fallback: number) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallback
  }
  return Math.floor(numericValue)
}

const enforceCacheSizeLimit = () => {
  if (cacheStore.size <= MAX_CACHE_ENTRIES) {
    return
  }

  let oldestKey: string | null = null
  let oldestUpdatedAt = Number.POSITIVE_INFINITY

  for (const [key, entry] of cacheStore.entries()) {
    if (entry.updatedAt < oldestUpdatedAt) {
      oldestUpdatedAt = entry.updatedAt
      oldestKey = key
    }
  }

  if (oldestKey) {
    cacheStore.delete(oldestKey)
  }
}

const startRefresh = <T>(
  key: string,
  entry: CacheEntry<T>,
  fetcher: () => Promise<T>,
  options: ExternalApiCacheOptions,
  isBackgroundRefresh: boolean
) => {
  const refreshPromise = fetcher()
    .then((value) => {
      const now = Date.now()
      entry.value = value
      entry.freshUntil = now + options.maxAgeSeconds * 1000
      entry.staleUntil = now + options.staleSeconds * 1000
      entry.updatedAt = now
      cacheStore.set(key, entry as CacheEntry<unknown>)
      enforceCacheSizeLimit()
      return value
    })
    .catch((error) => {
      entry.updatedAt = Date.now()
      if (!isBackgroundRefresh && entry.value === null) {
        cacheStore.delete(key)
      }
      throw error
    })
    .finally(() => {
      entry.pending = undefined
    })

  entry.pending = refreshPromise
  cacheStore.set(key, entry as CacheEntry<unknown>)
  return refreshPromise
}

export function getExternalApiCacheOptions(event: H3Event): ExternalApiCacheOptions {
  const runtimeConfig = useRuntimeConfig(event)
  const maxAgeSeconds = parsePositiveInt(
    runtimeConfig.externalApiCacheMaxAgeSeconds,
    DEFAULT_MAX_AGE_SECONDS
  )
  const staleSeconds = parsePositiveInt(
    runtimeConfig.externalApiCacheStaleSeconds,
    DEFAULT_STALE_SECONDS
  )

  return {
    maxAgeSeconds,
    staleSeconds: Math.max(staleSeconds, maxAgeSeconds),
  }
}

export function setExternalApiCacheHeaders(
  event: H3Event,
  options: ExternalApiCacheOptions,
  browserMaxAgeSeconds = 60
) {
  setHeader(
    event,
    'cache-control',
    `public, max-age=${Math.max(0, browserMaxAgeSeconds)}, s-maxage=${options.maxAgeSeconds}, stale-while-revalidate=${options.staleSeconds}`
  )
}

export async function withExternalApiSWRCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: ExternalApiCacheOptions
): Promise<T> {
  const now = Date.now()
  const existingEntry = cacheStore.get(key) as CacheEntry<T> | undefined

  if (existingEntry) {
    existingEntry.updatedAt = now

    if (existingEntry.value !== null && now <= existingEntry.freshUntil) {
      return existingEntry.value
    }

    if (existingEntry.pending) {
      if (existingEntry.value !== null && now <= existingEntry.staleUntil) {
        return existingEntry.value
      }
      return existingEntry.pending
    }

    if (existingEntry.value !== null && now <= existingEntry.staleUntil) {
      void startRefresh(key, existingEntry, fetcher, options, true).catch((error) => {
        console.error(`Background refresh failed for cache key "${key}":`, error)
      })
      return existingEntry.value
    }
  }

  const entry: CacheEntry<T> = existingEntry ?? {
    value: null,
    freshUntil: 0,
    staleUntil: 0,
    updatedAt: now,
  }

  return startRefresh(key, entry, fetcher, options, false)
}
