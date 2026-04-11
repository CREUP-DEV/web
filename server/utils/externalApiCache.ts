import type { H3Event } from 'h3'
import { setHeader } from 'h3'
import {
  getRequiredExternalApiCacheMaxAgeSeconds,
  getRequiredExternalApiCacheStaleSeconds,
} from './runtimeConfig'
import { logError } from './logger'

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

const touchCacheEntry = (key: string, entry: CacheEntry<unknown>) => {
  cacheStore.delete(key)
  cacheStore.set(key, entry)

  while (cacheStore.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value
    if (!oldestKey) {
      break
    }
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
  let resolveRefresh!: (value: T) => void
  let rejectRefresh!: (reason: unknown) => void

  const refreshPromise = new Promise<T>((resolve, reject) => {
    resolveRefresh = resolve
    rejectRefresh = reject
  })

  entry.pending = refreshPromise
  touchCacheEntry(key, entry as CacheEntry<unknown>)

  void (async () => {
    try {
      const value = await fetcher()
      const now = Date.now()
      entry.value = value
      entry.freshUntil = now + options.maxAgeSeconds * 1000
      entry.staleUntil = now + options.staleSeconds * 1000
      entry.updatedAt = now
      touchCacheEntry(key, entry as CacheEntry<unknown>)
      resolveRefresh(value)
    } catch (error) {
      entry.updatedAt = Date.now()
      if (!isBackgroundRefresh && entry.value === null) {
        cacheStore.delete(key)
      }
      rejectRefresh(error)
    } finally {
      entry.pending = undefined
    }
  })()

  return refreshPromise
}

export function getExternalApiCacheOptions(event: H3Event): ExternalApiCacheOptions {
  const maxAgeSeconds = getRequiredExternalApiCacheMaxAgeSeconds(event)
  const staleSeconds = getRequiredExternalApiCacheStaleSeconds(event)

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
    touchCacheEntry(key, existingEntry as CacheEntry<unknown>)

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
        logError('external-api-cache.refresh', error, { cacheKey: key })
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
