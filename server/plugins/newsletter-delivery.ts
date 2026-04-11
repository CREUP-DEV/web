import { logError, logInfo } from '../utils/logger'
import {
  processPendingNewsletterDeliveries,
  requeueActiveNewsletterDeliveriesForShutdown,
  requestNewsletterDeliveryShutdown,
  waitForNewsletterDeliveryIdle,
} from '../services/newsletterDeliveryService'
import { cleanupExpiredNewsletterConfirmTokens } from '../utils/newsletterSubscribers'

const DELIVERY_RECOVERY_INTERVAL_MS = 5 * 60 * 1000
const CONFIRM_TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000
const DELIVERY_SHUTDOWN_TIMEOUT_MS = 10_000

export default defineNitroPlugin((nitro) => {
  // Simple in-process lock: Node.js is single-threaded, so this boolean
  // prevents concurrent recovery runs within the same process instance.
  // Cross-process coordination is handled by the DB worker token mechanism.
  let recovering = false
  let activeRecoveryPromise: Promise<void> | null = null

  const runRecovery = () => {
    if (recovering) return
    recovering = true
    activeRecoveryPromise = processPendingNewsletterDeliveries()
      .catch((error) => {
        logError('newsletter.delivery.recovery', error)
      })
      .finally(() => {
        recovering = false
        activeRecoveryPromise = null
      })
  }

  const runConfirmTokenCleanup = () =>
    cleanupExpiredNewsletterConfirmTokens()
      .then((deletedCount) => {
        if (deletedCount > 0) {
          logInfo('newsletter.confirm-token.cleanup', { deletedCount })
        }
      })
      .catch((error) => {
        logError('newsletter.confirm-token.cleanup', error)
      })

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
  })
})
