import pLimit from 'p-limit'
import { createError, type H3Event } from 'h3'
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '../db'
import { newsletterDeliveries, newsletters } from '../db/schema'
import { sendNewsletterEmail } from '../utils/email/newsletterMailer'
import { getSiteDefaultImageRaw } from '../utils/admin/siteDefaultImages'
import { logError, logInfo } from '../utils/core/logger'
import { resolveAdminApiMessage } from '../utils/locale/adminApiErrorMessages'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import {
  claimNewsletterDeliveryWorker,
  isNewsletterDeliveryWorkerCurrent,
  releaseNewsletterDeliveryWorker,
  touchNewsletterDeliveryWorker,
} from './newsletterDeliveryLease'
import {
  NEWSLETTER_DELIVERY_STATUS,
  type NewsletterRecord,
  claimNewsletterDeliveryBatch,
  deactivateSubscriberOnBounce,
  markDeliveryFailed,
  markDeliverySent,
  markInterruptedNewsletterDeliveries,
  requeueSendingNewsletterDeliveries,
  resetNewsletterDeliveryRetryState,
  seedNewsletterDeliveries,
  setNewsletterDeliverySnapshot,
} from './newsletterDeliveryRepository'

export interface NewsletterDeliveryResult {
  errorCount: number
  failedRecipients: string[]
  sent: boolean
  sentCount: number
  total: number
}

const activeNewsletterRuns = new Map<string, string>()
let newsletterShutdownRequested = false

export async function processNewsletterDeliveryRun(
  item: NewsletterRecord
): Promise<NewsletterDeliveryResult | false> {
  const workerToken = item.lastDeliveryWorkerToken ?? ''
  let cancelled = false

  if (!workerToken) {
    return false
  }

  let releaseArgs: Partial<typeof newsletters.$inferInsert> | null = null
  let result: NewsletterDeliveryResult | false = false
  activeNewsletterRuns.set(item.id, workerToken)

  try {
    await seedNewsletterDeliveries(item)
    await touchNewsletterDeliveryWorker(item.id, workerToken)

    const defaultCoverPath = await getSiteDefaultImageRaw(
      SITE_DEFAULT_IMAGE_SCOPE.newsletter,
      SITE_DEFAULT_IMAGE_SLOT.newsletterCover
    )
    const resolvedCoverPath = item.coverImage ?? defaultCoverPath

    while (true) {
      if (newsletterShutdownRequested) {
        break
      }

      if (!(await isNewsletterDeliveryWorkerCurrent(item.id, workerToken))) {
        cancelled = true
        await requeueSendingNewsletterDeliveries(item.id, 'Envío cancelado por administración')
        break
      }

      const batch = await claimNewsletterDeliveryBatch(item)

      if (batch.length === 0) {
        break
      }

      const limit = pLimit(5)

      const tasks = batch.map(({ delivery, subscriber }) =>
        limit(async () => {
          if (!subscriber || !subscriber.active) {
            await markDeliveryFailed(delivery.id, new Error('La suscripción ya no está activa'))
            await touchNewsletterDeliveryWorker(item.id, workerToken)
            return
          }

          try {
            await sendNewsletterEmail(
              item,
              subscriber,
              'Falta la configuración SMTP para enviar correos',
              resolvedCoverPath
            )
            await markDeliverySent(delivery.id)
          } catch (error) {
            await markDeliveryFailed(delivery.id, error)
            logError('newsletter.send.recipient', error, {
              deliveryId: delivery.id,
              newsletterId: item.id,
              subscriberId: subscriber.id,
            })
            try {
              await deactivateSubscriberOnBounce(subscriber.id)
            } catch (bounceError) {
              logError('newsletter.send.bounce-deactivate', bounceError, {
                deliveryId: delivery.id,
                newsletterId: item.id,
                subscriberId: subscriber.id,
              })
            }
          } finally {
            await touchNewsletterDeliveryWorker(item.id, workerToken)
          }
        })
      )

      const results = await Promise.allSettled(tasks)

      for (const result of results) {
        if (result.status === 'rejected') {
          logError('newsletter.send.batch-task', result.reason)
        }
      }
    }

    const snapshot = await setNewsletterDeliverySnapshot(item.id)
    const now = new Date()
    const completedSuccessfully = !cancelled && (snapshot.total === 0 || snapshot.errorCount === 0)

    releaseArgs = {
      lastDeliveryFinishedAt: now,
      lastDeliveryHeartbeatAt: null,
      sentAt: completedSuccessfully ? now : null,
    }

    logInfo('newsletter.delivery.completed', {
      completedSuccessfully,
      errorCount: snapshot.errorCount,
      newsletterId: item.id,
      sentCount: snapshot.sentCount,
      total: snapshot.total,
    })

    result = { ...snapshot, sent: completedSuccessfully }
  } catch (error) {
    logError('newsletter.delivery.batch', error, { newsletterId: item.id })
    await markInterruptedNewsletterDeliveries(item.id, error)
    await setNewsletterDeliverySnapshot(item.id)
    releaseArgs = {
      lastDeliveryFinishedAt: new Date(),
      lastDeliveryHeartbeatAt: null,
      sentAt: null,
    }
  } finally {
    try {
      await releaseNewsletterDeliveryWorker(
        item.id,
        workerToken,
        releaseArgs ?? {
          lastDeliveryFinishedAt: new Date(),
          lastDeliveryHeartbeatAt: null,
          sentAt: null,
        }
      )
    } catch (releaseError) {
      logError('newsletter.delivery.worker-release-failed', releaseError, { newsletterId: item.id })
    } finally {
      activeNewsletterRuns.delete(item.id)
    }
  }

  return result
}

export async function processPendingNewsletterDeliveries() {
  const pendingItems = await db.query.newsletters.findMany({
    orderBy: [asc(newsletters.lastDeliveryStartedAt), asc(newsletters.id)],
    where: and(isNotNull(newsletters.lastDeliveryWorkerToken), isNull(newsletters.sentAt)),
  })

  for (const item of pendingItems) {
    if (newsletterShutdownRequested) {
      break
    }

    await processNewsletterDeliveryRun(item)
  }
}

export async function processClaimedNewsletterDelivery(
  newsletterId: string,
  workerToken: string
): Promise<NewsletterDeliveryResult | false> {
  const item = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
  })

  if (!item || item.lastDeliveryWorkerToken !== workerToken) {
    return false
  }

  return processNewsletterDeliveryRun(item)
}

export function requestNewsletterDeliveryShutdown() {
  newsletterShutdownRequested = true
}

export function getNewsletterDeliveryRuntimeState() {
  return {
    activeNewsletterIds: [...activeNewsletterRuns.keys()],
    activeRunCount: activeNewsletterRuns.size,
    shutdownRequested: newsletterShutdownRequested,
  }
}

export async function waitForNewsletterDeliveryIdle(timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now()

  while (activeNewsletterRuns.size > 0) {
    if (Date.now() - startedAt >= timeoutMs) {
      return false
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return true
}

export async function requeueActiveNewsletterDeliveriesForShutdown() {
  const activeRuns = [...activeNewsletterRuns.entries()]

  if (activeRuns.length === 0) {
    return
  }

  await Promise.all(
    activeRuns.map(async ([newsletterId]) => {
      await db
        .update(newsletterDeliveries)
        .set({
          lastError: 'Envío interrumpido por apagado del servidor',
          status: NEWSLETTER_DELIVERY_STATUS.queued,
        })
        .where(
          and(
            eq(newsletterDeliveries.newsletterId, newsletterId),
            eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending)
          )
        )
    })
  )

  logInfo('newsletter.delivery.shutdown.requeue', {
    newsletterIds: activeRuns.map(([newsletterId]) => newsletterId),
  })
}

export async function claimNewsletterForSending(
  id: string,
  event?: H3Event
): Promise<NewsletterRecord> {
  const claimedItem = await claimNewsletterDeliveryWorker(id)

  if (claimedItem) {
    await resetNewsletterDeliveryRetryState(claimedItem.id)

    const currentItem = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, claimedItem.id),
    })

    if (currentItem) {
      return currentItem
    }

    return {
      ...claimedItem,
      lastDeliveryErrorCount: null,
      lastDeliveryFailedRecipients: null,
      lastDeliveryFinishedAt: null,
      lastDeliverySentCount: null,
      lastDeliveryTotal: null,
    }
  }

  const current = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })

  if (!current) {
    throw createError({
      statusCode: 404,
      message: resolveAdminApiMessage('newsletterNotFound', event),
    })
  }

  if (current.sentAt) {
    throw createError({
      statusCode: 409,
      message: resolveAdminApiMessage('newsletterAlreadySent', event),
    })
  }

  if (current.lastDeliveryWorkerToken) {
    throw createError({
      statusCode: 409,
      message: resolveAdminApiMessage('newsletterAlreadySending', event),
    })
  }

  throw createError({
    statusCode: 409,
    message: resolveAdminApiMessage('newsletterCannotSend', event),
  })
}

export async function sendNewsletterById(id: string): Promise<{
  item: NewsletterRecord
  result: NewsletterDeliveryResult
}> {
  const item = await claimNewsletterForSending(id)
  const deliveryResult = await processNewsletterDeliveryRun(item)
  const updatedItem = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })

  return {
    item: updatedItem ?? item,
    result:
      deliveryResult === false
        ? {
            ...(await setNewsletterDeliverySnapshot(id)),
            sent: false,
          }
        : deliveryResult,
  }
}
