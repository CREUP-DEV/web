import redisDriver from 'unstorage/drivers/redis'
import { getOptionalRuntimeConfigString } from '../utils/runtimeConfig'

const CACHE_STORAGE_BASE = 'creup:web:cache'

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const redisUrl =
    getOptionalRuntimeConfigString(runtimeConfig.redisUrl) || process.env.REDIS_URL?.trim() || ''

  if (!redisUrl) {
    return
  }

  useStorage().mount(
    'cache',
    redisDriver({
      base: CACHE_STORAGE_BASE,
      preConnect: true,
      url: redisUrl,
    })
  )
})
