import { Worker } from 'bullmq'
import { cleanupExpiredAuthRows } from '../utils/authHousekeeping'
import {
  BACKGROUND_JOB_NAMES,
  BACKGROUND_QUEUE_NAMES,
  closeBackgroundJobResources,
  enqueueStartupMaintenanceJobs,
  ensureBackgroundJobSchedulers,
  isNewsletterSendJob,
} from '../utils/backgroundJobs'
import { logError, logInfo } from '../utils/logger'
import { cleanupExpiredNewsletterConfirmTokens } from '../utils/newsletterSubscribers'
import { createBullMqConnection } from '../utils/redis'
import {
  processClaimedNewsletterDelivery,
  processPendingNewsletterDeliveries,
  requeueActiveNewsletterDeliveriesForShutdown,
  requestNewsletterDeliveryShutdown,
  waitForNewsletterDeliveryIdle,
} from '../services/newsletterDeliveryService'

const DELIVERY_SHUTDOWN_TIMEOUT_MS = 10_000

export default defineNitroPlugin((nitro) => {
  const newsletterWorker = new Worker(
    BACKGROUND_QUEUE_NAMES.newsletter,
    async (job) => {
      if (!isNewsletterSendJob(job)) {
        return
      }

      await processClaimedNewsletterDelivery(job.data.newsletterId, job.data.workerToken)
    },
    {
      connection: createBullMqConnection(),
      concurrency: 1,
      prefix: 'creup:web:bullmq',
    }
  )

  const maintenanceWorker = new Worker(
    BACKGROUND_QUEUE_NAMES.maintenance,
    async (job) => {
      switch (job.name) {
        case BACKGROUND_JOB_NAMES.newsletterRecovery:
          await processPendingNewsletterDeliveries()
          return
        case BACKGROUND_JOB_NAMES.newsletterConfirmTokenCleanup: {
          const deletedCount = await cleanupExpiredNewsletterConfirmTokens()
          if (deletedCount > 0) {
            logInfo('newsletter.confirm-token.cleanup', { deletedCount })
          }
          return
        }
        case BACKGROUND_JOB_NAMES.authHousekeeping: {
          const cleanupResult = await cleanupExpiredAuthRows()
          if (cleanupResult.deletedSessionCount > 0 || cleanupResult.deletedVerificationCount > 0) {
            logInfo('auth.expired-row.cleanup', {
              deletedSessionCount: cleanupResult.deletedSessionCount,
              deletedVerificationCount: cleanupResult.deletedVerificationCount,
            })
          }
          return
        }
      }
    },
    {
      connection: createBullMqConnection(),
      concurrency: 1,
      prefix: 'creup:web:bullmq',
    }
  )

  newsletterWorker.on('failed', (job, error) => {
    logError('background-jobs.newsletter.failed', error, {
      jobId: job?.id ?? null,
      jobName: job?.name ?? null,
    })
  })

  maintenanceWorker.on('failed', (job, error) => {
    logError('background-jobs.maintenance.failed', error, {
      jobId: job?.id ?? null,
      jobName: job?.name ?? null,
    })
  })

  void ensureBackgroundJobSchedulers()
    .then(() => enqueueStartupMaintenanceJobs())
    .catch((error) => {
      logError('background-jobs.scheduler-init', error)
    })

  nitro.hooks.hookOnce('close', async () => {
    requestNewsletterDeliveryShutdown()

    const completedGracefully = await waitForNewsletterDeliveryIdle(DELIVERY_SHUTDOWN_TIMEOUT_MS)

    if (!completedGracefully) {
      logInfo('newsletter.delivery.shutdown.timeout', {
        timeoutMs: DELIVERY_SHUTDOWN_TIMEOUT_MS,
      })
      await requeueActiveNewsletterDeliveriesForShutdown()
    }

    await Promise.allSettled([newsletterWorker.close(), maintenanceWorker.close()])

    await closeBackgroundJobResources()
  })
})
