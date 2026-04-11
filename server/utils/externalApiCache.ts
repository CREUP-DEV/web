import type { H3Event } from 'h3'
import { setHeader } from 'h3'
import {
  getRequiredExternalApiCacheMaxAgeSeconds,
  getRequiredExternalApiCacheStaleSeconds,
} from './runtimeConfig'
import { buildRedisKey, getRedisClient } from './redis'
import { logError } from './logger'

export interface ExternalApiCacheOptions {
  maxAgeSeconds: number
  staleSeconds: number
}

interface CacheEntry<T> {
  value: T
  freshUntil: number
  staleUntil: number
  updatedAt: number
}

const EXTERNAL_API_CACHE_LOCK_TTL_MS = 30_000
const EXTERNAL_API_CACHE_WAIT_TIMEOUT_MS = 5_000
const EXTERNAL_API_CACHE_WAIT_INTERVAL_MS = 100
const EXTERNAL_API_CACHE_TTL_BUFFER_SECONDS = 60
const externalApiPendingRefreshes = new Map<string, Promise<unknown>>()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildExternalApiCacheKeys = (key: string) => ({
  dataKey: buildRedisKey('external-api-cache', key),
  lockKey: buildRedisKey('external-api-cache-lock', key),
})

const readCacheEntry = async <T>(key: string) => {
  const redis = getRedisClient()
  const { dataKey } = buildExternalApiCacheKeys(key)
  const rawValue = await redis.get(dataKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as CacheEntry<T>
  } catch (error) {
    await redis.del(dataKey)
    logError('external-api-cache.deserialize', error, { cacheKey: key })
    return null
  }
}

const writeCacheEntry = async <T>(key: string, value: T, options: ExternalApiCacheOptions) => {
  const redis = getRedisClient()
  const { dataKey } = buildExternalApiCacheKeys(key)
  const now = Date.now()
  const record: CacheEntry<T> = {
    value,
    freshUntil: now + options.maxAgeSeconds * 1000,
    staleUntil: now + options.staleSeconds * 1000,
    updatedAt: now,
  }
  const ttlSeconds =
    Math.max(options.maxAgeSeconds, options.staleSeconds) + EXTERNAL_API_CACHE_TTL_BUFFER_SECONDS

  await redis.set(dataKey, JSON.stringify(record), 'EX', ttlSeconds)
  return record
}

const acquireRefreshLock = async (key: string, token: string) => {
  const redis = getRedisClient()
  const { lockKey } = buildExternalApiCacheKeys(key)
  const result = await redis.set(lockKey, token, 'PX', EXTERNAL_API_CACHE_LOCK_TTL_MS, 'NX')
  return result === 'OK'
}

const releaseRefreshLock = async (key: string, token: string) => {
  const redis = getRedisClient()
  const { lockKey } = buildExternalApiCacheKeys(key)

  await redis.eval(
    `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      end
      return 0
    `,
    1,
    lockKey,
    token
  )
}

const waitForCacheEntry = async <T>(key: string, timeoutMs: number) => {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const entry = await readCacheEntry<T>(key)
    if (entry) {
      return entry
    }

    await sleep(EXTERNAL_API_CACHE_WAIT_INTERVAL_MS)
  }

  return null
}

const refreshCacheEntry = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: ExternalApiCacheOptions
) => {
  const existingPromise = externalApiPendingRefreshes.get(key) as Promise<T> | undefined
  if (existingPromise) {
    return existingPromise
  }

  const refreshPromise = (async () => {
    const lockToken = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`
    const hasLock = await acquireRefreshLock(key, lockToken)

    if (!hasLock) {
      const entry = await waitForCacheEntry<T>(key, EXTERNAL_API_CACHE_WAIT_TIMEOUT_MS)
      if (entry) {
        return entry.value
      }
    }

    try {
      const value = await fetcher()
      await writeCacheEntry(key, value, options)
      return value
    } finally {
      if (hasLock) {
        await releaseRefreshLock(key, lockToken)
      }
    }
  })()

  externalApiPendingRefreshes.set(key, refreshPromise)
  refreshPromise.finally(() => {
    externalApiPendingRefreshes.delete(key)
  })

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
  const existingEntry = await readCacheEntry<T>(key)

  if (existingEntry) {
    if (now <= existingEntry.freshUntil) {
      return existingEntry.value
    }

    if (now <= existingEntry.staleUntil) {
      void refreshCacheEntry(key, fetcher, options).catch((error) => {
        logError('external-api-cache.refresh', error, { cacheKey: key })
      })
      return existingEntry.value
    }
  }

  return refreshCacheEntry(key, fetcher, options)
}
