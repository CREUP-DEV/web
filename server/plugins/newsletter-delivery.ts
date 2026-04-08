import { logError, logInfo } from '../utils/logger'
import { processPendingNewsletterDeliveries } from '../utils/newsletters'
import { cleanupExpiredNewsletterConfirmTokens } from '../utils/newsletterSubscribers'

const DELIVERY_RECOVERY_INTERVAL_MS = 5 * 60 * 1000
const CONFIRM_TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000

export default defineNitroPlugin((nitro) => {
  // Simple in-process lock: Node.js is single-threaded, so this boolean
  // prevents concurrent recovery runs within the same process instance.
  // Cross-process coordination is handled by the DB worker token mechanism.
  let recovering = false

  const runRecovery = () => {
    if (recovering) return
    recovering = true
    processPendingNewsletterDeliveries()
      .catch((error) => {
        logError('newsletter.delivery.recovery', error)
      })
      .finally(() => {
        recovering = false
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

  nitro.hooks.hookOnce('close', () => {
    clearInterval(recoveryIntervalId)
    clearInterval(cleanupIntervalId)
  })
})
