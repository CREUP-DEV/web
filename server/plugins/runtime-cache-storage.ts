import redisDriver from 'unstorage/drivers/redis'
import { getOptionalRuntimeConfigString } from '../utils/core/runtimeConfig'

const CACHE_STORAGE_BASE = 'creup:web:cache'
// GC backstop so cached handler keys cannot accumulate forever in Redis. Comfortably
// above the longest cached handler's freshness window (maxAge 300s + swr) so still-warm
// entries are never evicted between revalidations; abandoned keys expire after this.
const CACHE_REDIS_TTL_SECONDS = 3600

// nuxt-security keeps its rate-limiter state under this named storage mount
// (useStorage('#rate-limiter-storage') in its middleware).
const RATE_LIMITER_STORAGE_MOUNT = '#rate-limiter-storage'
const RATE_LIMITER_STORAGE_BASE = 'creup:web:rate-limiter'
// The limiter window is 300s; keep keys a while longer purely as GC hygiene so
// abandoned-IP buckets do not linger forever.
const RATE_LIMITER_REDIS_TTL_SECONDS = 900

export default defineNitroPlugin(async () => {
  const runtimeConfig = useRuntimeConfig()
  const redisUrl = getOptionalRuntimeConfigString(runtimeConfig.redisUrl) || ''

  if (!redisUrl) {
    return
  }

  const storage = useStorage()

  // Move the nuxt-security rate limiter off its default in-process lruCache (which
  // counts per instance and resets on restart) onto Redis, so the limit is shared
  // across instances and durable. nuxt-security has already mounted this base and
  // unstorage refuses to mount over an existing base, so unmount it first.
  if (storage.getMount(RATE_LIMITER_STORAGE_MOUNT).base === `${RATE_LIMITER_STORAGE_MOUNT}:`) {
    await storage.unmount(RATE_LIMITER_STORAGE_MOUNT)
  }
  storage.mount(
    RATE_LIMITER_STORAGE_MOUNT,
    redisDriver({
      base: RATE_LIMITER_STORAGE_BASE,
      preConnect: true,
      url: redisUrl,
      ttl: RATE_LIMITER_REDIS_TTL_SECONDS,
    })
  )

  if (storage.getMount('cache').base === 'cache:') {
    return
  }

  storage.mount(
    'cache',
    redisDriver({
      base: CACHE_STORAGE_BASE,
      preConnect: true,
      url: redisUrl,
      ttl: CACHE_REDIS_TTL_SECONDS,
    })
  )
})
