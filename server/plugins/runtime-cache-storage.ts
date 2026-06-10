import redisDriver from 'unstorage/drivers/redis'
import { getOptionalRuntimeConfigString } from '../utils/core/runtimeConfig'

const CACHE_STORAGE_BASE = 'creup:web:cache'
// GC backstop so cached handler keys cannot accumulate forever in Redis. Comfortably
// above the longest cached handler's freshness window (maxAge 300s + swr) so still-warm
// entries are never evicted between revalidations; abandoned keys expire after this.
const CACHE_REDIS_TTL_SECONDS = 3600

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const redisUrl = getOptionalRuntimeConfigString(runtimeConfig.redisUrl) || ''

  if (!redisUrl) {
    return
  }

  const storage = useStorage()
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
