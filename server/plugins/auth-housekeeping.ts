import { cleanupExpiredAuthRows } from '../utils/authHousekeeping'
import { logError, logInfo } from '../utils/logger'
import { releaseRedisLock, tryAcquireRedisLock } from '../utils/redis'

const AUTH_HOUSEKEEPING_INTERVAL_MS = 60 * 60 * 1000
const AUTH_HOUSEKEEPING_LOCK_TTL_MS = 10 * 60 * 1000

export default defineNitroPlugin((nitro) => {
  let running = false
  let activeRunPromise: Promise<void> | null = null

  const runHousekeeping = () => {
    if (running) {
      return
    }

    running = true
    activeRunPromise = (async () => {
      const lock = await tryAcquireRedisLock(
        'scheduler',
        'auth-housekeeping',
        AUTH_HOUSEKEEPING_LOCK_TTL_MS
      )

      if (!lock) {
        return
      }

      try {
        const cleanupResult = await cleanupExpiredAuthRows()

        if (cleanupResult.deletedSessionCount > 0) {
          logInfo('auth.expired-row.cleanup', cleanupResult)
        }
      } finally {
        await releaseRedisLock(lock).catch((error) => {
          logError('auth.housekeeping.lock-release', error)
        })
      }
    })()
      .catch((error) => {
        logError('auth.housekeeping', error)
      })
      .finally(() => {
        running = false
        activeRunPromise = null
      })
  }

  void runHousekeeping()

  const intervalId = setInterval(() => {
    void runHousekeeping()
  }, AUTH_HOUSEKEEPING_INTERVAL_MS)

  nitro.hooks.hookOnce('close', async () => {
    clearInterval(intervalId)

    if (activeRunPromise) {
      await activeRunPromise.catch((error) => {
        logError('auth.housekeeping.shutdown.await', error)
      })
    }
  })
})
