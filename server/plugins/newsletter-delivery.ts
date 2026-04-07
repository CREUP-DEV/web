import { logError, logInfo } from '../utils/logger'
import { processPendingNewsletterDeliveries } from '../utils/newsletters'
import { cleanupExpiredNewsletterConfirmTokens } from '../utils/newsletterSubscribers'

const DELIVERY_RECOVERY_INTERVAL_MS = 5 * 60 * 1000
const CONFIRM_TOKEN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000

export default defineNitroPlugin((nitro) => {
  const runRecovery = () =>
    processPendingNewsletterDeliveries().catch((error) => {
      logError('newsletter.delivery.recovery', error)
    })

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

  const recoveryIntervalId = setInterval(() => void runRecovery(), DELIVERY_RECOVERY_INTERVAL_MS)
  const cleanupIntervalId = setInterval(
    () => void runConfirmTokenCleanup(),
    CONFIRM_TOKEN_CLEANUP_INTERVAL_MS
  )

  nitro.hooks.hookOnce('close', () => {
    clearInterval(recoveryIntervalId)
    clearInterval(cleanupIntervalId)
  })
})
