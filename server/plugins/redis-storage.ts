import redisDriver from 'unstorage/drivers/redis'
import { getRequiredRedisUrl } from '../utils/runtimeConfig'

export default defineNitroPlugin(() => {
  const redisUrl = getRequiredRedisUrl()
  const storage = useStorage()

  storage.mount(
    'cache',
    redisDriver({
      base: 'creup:web:cache',
      url: redisUrl,
    })
  )
})
