import redisDriver from 'unstorage/drivers/redis'
import { getOptionalRuntimeConfigString } from '../utils/runtimeConfig'

const CACHE_STORAGE_BASE = 'creup:web:cache'

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
    })
  )
})
