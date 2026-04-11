import { logError, logInfo } from '../utils/logger'
import { releaseRedisLock, tryAcquireRedisLock } from '../utils/redis'
import {
  processPendingNewsletterDeliveries,
  requeueActiveNewsletterDeliveriesForShutdown,
  requestNewsletterDeliveryShutdown,
  waitForNewsletterDeliveryIdle,
} from '../services/newsletterDeliveryService'
import { cleanupExpiredNewsletterConfirmTokens } from '../utils/newsletterSubscribers'

const DELIVERY_RECOVERY_INTERVAL_MS = 5 * 60 * 1000
const DELIVERY_RECOVERY_LOCK_TTL_MS = 10 * 60 * 1000
const CONFIRM_TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000
const CONFIRM_TOKEN_CLEANUP_LOCK_TTL_MS = 10 * 60 * 1000
const DELIVERY_SHUTDOWN_TIMEOUT_MS = 10_000

export default defineNitroPlugin((nitro) => {
  // Local booleans prevent duplicate timer executions inside one process.
  // Redis locks prevent all instances from running same periodic task at once.
  // DB worker tokens still protect actual newsletter delivery claims.
  let recovering = false
  let cleaningTokens = false
  let activeRecoveryPromise: Promise<void> | null = null
  let activeCleanupPromise: Promise<void> | null = null

  const runRecovery = () => {
    if (recovering) return
    recovering = true
    activeRecoveryPromise = (async () => {
      const lock = await tryAcquireRedisLock(
        'scheduler',
        'newsletter-delivery-recovery',
        DELIVERY_RECOVERY_LOCK_TTL_MS
      )

      if (!lock) {
        return
      }

      try {
        await processPendingNewsletterDeliveries()
      } finally {
        await releaseRedisLock(lock).catch((error) => {
          logError('newsletter.delivery.recovery-lock-release', error)
        })
      }
    })()
      .catch((error) => {
        logError('newsletter.delivery.recovery', error)
      })
      .finally(() => {
        recovering = false
        activeRecoveryPromise = null
      })
  }

  const runConfirmTokenCleanup = () => {
    if (cleaningTokens) {
      return
    }

    cleaningTokens = true
    activeCleanupPromise = (async () => {
      const lock = await tryAcquireRedisLock(
        'scheduler',
        'newsletter-confirm-token-cleanup',
        CONFIRM_TOKEN_CLEANUP_LOCK_TTL_MS
      )

      if (!lock) {
        return
      }

      try {
        return await cleanupExpiredNewsletterConfirmTokens()
      } finally {
        await releaseRedisLock(lock).catch((error) => {
          logError('newsletter.confirm-token.cleanup-lock-release', error)
        })
      }
    })()
      .then((deletedCount) => {
        if (deletedCount > 0) {
          logInfo('newsletter.confirm-token.cleanup', { deletedCount })
        }
      })
      .catch((error) => {
        logError('newsletter.confirm-token.cleanup', error)
      })
      .finally(() => {
        cleaningTokens = false
        activeCleanupPromise = null
      })
  }

  void runRecovery()
  void runConfirmTokenCleanup()

  const recoveryIntervalId = setInterval(() => runRecovery(), DELIVERY_RECOVERY_INTERVAL_MS)
  const cleanupIntervalId = setInterval(
    () => void runConfirmTokenCleanup(),
    CONFIRM_TOKEN_CLEANUP_INTERVAL_MS
  )

  nitro.hooks.hookOnce('close', async () => {
    clearInterval(recoveryIntervalId)
    clearInterval(cleanupIntervalId)

    requestNewsletterDeliveryShutdown()

    const completedGracefully = await waitForNewsletterDeliveryIdle(DELIVERY_SHUTDOWN_TIMEOUT_MS)

    if (!completedGracefully) {
      logInfo('newsletter.delivery.shutdown.timeout', {
        timeoutMs: DELIVERY_SHUTDOWN_TIMEOUT_MS,
      })
      await requeueActiveNewsletterDeliveriesForShutdown()
    }

    if (completedGracefully && activeRecoveryPromise) {
      await activeRecoveryPromise.catch((error) => {
        logError('newsletter.delivery.shutdown.await', error)
      })
    }

    if (activeCleanupPromise) {
      await activeCleanupPromise.catch((error) => {
        logError('newsletter.confirm-token.cleanup.shutdown.await', error)
      })
    }
  })
})
