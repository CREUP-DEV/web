import pLimit from 'p-limit'
import { createId } from '@paralleldrive/cuid2'
import { createError } from 'h3'
import { and, asc, count, eq, inArray, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletterDeliveries, newsletters, newsletterSubscribers } from '../db/schema'
import { sendNewsletterEmail } from '../utils/newsletterMailer'
import { logError, logInfo } from '../utils/logger'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../utils/newsletterSubscribers'
import { NEWSLETTER_DELIVERY_MAX_ATTEMPTS } from '../utils/newsletters'

// 50 per batch: keeps each DB transaction and SMTP burst manageable; too large increases memory pressure per cycle
const NEWSLETTER_DELIVERY_BATCH_SIZE = 50
// 2 min stale threshold: worker must heartbeat every iteration; if silent for 2+ min, assume crashed and allow claim
const NEWSLETTER_DELIVERY_WORKER_STALE_MS = 2 * 60 * 1000
const NEWSLETTER_DELIVERY_STATUS = {
  failed: 'failed',
  queued: 'queued',
  sending: 'sending',
  sent: 'sent',
} as const

type NewsletterRecord = typeof newsletters.$inferSelect

interface NewsletterDeliveryCandidate {
  delivery: typeof newsletterDeliveries.$inferSelect
  subscriber: Pick<
    typeof newsletterSubscribers.$inferSelect,
    'active' | 'email' | 'id' | 'subscribedAt'
  > | null
}

export interface NewsletterDeliveryResult {
  errorCount: number
  failedRecipients: string[]
  sent: boolean
  sentCount: number
  total: number
}

const activeNewsletterRuns = new Map<string, string>()
let newsletterShutdownRequested = false

function getNewsletterDeliveryStaleBefore() {
  return new Date(Date.now() - NEWSLETTER_DELIVERY_WORKER_STALE_MS)
}

function normalizeDeliveryError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500)
  }

  return 'No se pudo enviar el correo'
}

async function setNewsletterDeliverySnapshot(newsletterId: string) {
  return db.transaction(async (tx) => {
    const [summary] = await tx
      .select({
        errorCount:
          sql<number>`coalesce(sum(case when ${newsletterDeliveries.status} = ${NEWSLETTER_DELIVERY_STATUS.failed} then 1 else 0 end), 0)`.mapWith(
            Number
          ),
        sentCount:
          sql<number>`coalesce(sum(case when ${newsletterDeliveries.status} = ${NEWSLETTER_DELIVERY_STATUS.sent} then 1 else 0 end), 0)`.mapWith(
            Number
          ),
        total: sql<number>`count(*)`.mapWith(Number),
      })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.newsletterId, newsletterId))

    const failedRows = await tx
      .select({
        email: newsletterSubscribers.email,
      })
      .from(newsletterDeliveries)
      .innerJoin(
        newsletterSubscribers,
        eq(newsletterSubscribers.id, newsletterDeliveries.subscriberId)
      )
      .where(
        and(
          eq(newsletterDeliveries.newsletterId, newsletterId),
          eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed)
        )
      )
      .orderBy(asc(newsletterSubscribers.email))

    const failedRecipients = failedRows.map((row) => row.email)

    await tx
      .update(newsletters)
      .set({
        lastDeliveryErrorCount: summary?.errorCount ?? 0,
        lastDeliveryFailedRecipients: failedRecipients.length > 0 ? failedRecipients : null,
        lastDeliverySentCount: summary?.sentCount ?? 0,
        lastDeliveryTotal: summary?.total ?? 0,
      })
      .where(eq(newsletters.id, newsletterId))

    return {
      errorCount: summary?.errorCount ?? 0,
      failedRecipients,
      sentCount: summary?.sentCount ?? 0,
      total: summary?.total ?? 0,
    }
  })
}

async function seedNewsletterDeliveries(item: NewsletterRecord) {
  const startedAt = item.lastDeliveryStartedAt ?? new Date()

  await db.transaction(async (tx) => {
    if (!item.lastDeliveryStartedAt) {
      await tx
        .update(newsletters)
        .set({ lastDeliveryStartedAt: startedAt })
        .where(eq(newsletters.id, item.id))
    }

    await tx
      .insert(newsletterDeliveries)
      .select(
        tx
          .select({
            newsletterId: sql<string>`${item.id}`.as('newsletter_id'),
            subscriberId: newsletterSubscribers.id,
          })
          .from(newsletterSubscribers)
          .where(
            and(
              eq(newsletterSubscribers.active, true),
              lte(newsletterSubscribers.subscribedAt, startedAt)
            )
          )
      )
      .onConflictDoNothing({
        target: [newsletterDeliveries.newsletterId, newsletterDeliveries.subscriberId],
      })

    await tx
      .update(newsletterDeliveries)
      .set({
        lastError: null,
        status: NEWSLETTER_DELIVERY_STATUS.queued,
      })
      .where(
        and(
          eq(newsletterDeliveries.newsletterId, item.id),
          eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed),
          lt(newsletterDeliveries.attempts, NEWSLETTER_DELIVERY_MAX_ATTEMPTS)
        )
      )
  })

  return setNewsletterDeliverySnapshot(item.id)
}

async function resetNewsletterDeliveryRetryState(newsletterId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(newsletterDeliveries)
      .set({
        attempts: 0,
        lastAttemptAt: null,
        lastError: null,
        sentAt: null,
        status: NEWSLETTER_DELIVERY_STATUS.queued,
      })
      .where(
        and(
          eq(newsletterDeliveries.newsletterId, newsletterId),
          inArray(newsletterDeliveries.status, [
            NEWSLETTER_DELIVERY_STATUS.failed,
            NEWSLETTER_DELIVERY_STATUS.sending,
          ])
        )
      )

    await tx
      .update(newsletters)
      .set({
        lastDeliveryErrorCount: null,
        lastDeliveryFailedRecipients: null,
        lastDeliveryFinishedAt: null,
        lastDeliverySentCount: null,
        lastDeliveryTotal: null,
      })
      .where(eq(newsletters.id, newsletterId))
  })
}

async function touchNewsletterDeliveryWorker(newsletterId: string, workerToken: string) {
  await db
    .update(newsletters)
    .set({
      lastDeliveryHeartbeatAt: new Date(),
    })
    .where(
      and(eq(newsletters.id, newsletterId), eq(newsletters.lastDeliveryWorkerToken, workerToken))
    )
}

async function isNewsletterDeliveryWorkerCurrent(newsletterId: string, workerToken: string) {
  const item = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, newsletterId),
    columns: {
      id: true,
      lastDeliveryFinishedAt: true,
      lastDeliveryWorkerToken: true,
    },
  })

  return Boolean(
    item && item.lastDeliveryFinishedAt === null && item.lastDeliveryWorkerToken === workerToken
  )
}

async function claimNewsletterDeliveryWorker(id: string) {
  const workerToken = createId()
  const now = new Date()
  const staleBefore = getNewsletterDeliveryStaleBefore()

  const [item] = await db
    .update(newsletters)
    .set({
      lastDeliveryFinishedAt: null,
      lastDeliveryHeartbeatAt: now,
      lastDeliveryStartedAt: sql`coalesce(${newsletters.lastDeliveryStartedAt}, ${now})`,
      lastDeliveryWorkerToken: workerToken,
    })
    .where(
      and(
        eq(newsletters.id, id),
        eq(newsletters.active, true),
        isNull(newsletters.sentAt),
        or(
          isNull(newsletters.lastDeliveryWorkerToken),
          and(
            isNotNull(newsletters.lastDeliveryWorkerToken),
            or(
              isNull(newsletters.lastDeliveryHeartbeatAt),
              lte(newsletters.lastDeliveryHeartbeatAt, staleBefore)
            )
          )
        )
      )
    )
    .returning()

  return item ?? null
}

async function releaseNewsletterDeliveryWorker(
  newsletterId: string,
  workerToken: string,
  values: Partial<typeof newsletters.$inferInsert> = {}
) {
  await db
    .update(newsletters)
    .set({
      ...values,
      lastDeliveryWorkerToken: null,
    })
    .where(
      and(eq(newsletters.id, newsletterId), eq(newsletters.lastDeliveryWorkerToken, workerToken))
    )
}

async function claimNewsletterDeliveryBatch(
  item: NewsletterRecord
): Promise<NewsletterDeliveryCandidate[]> {
  const staleBefore = getNewsletterDeliveryStaleBefore()

  await db
    .update(newsletterDeliveries)
    .set({ status: NEWSLETTER_DELIVERY_STATUS.queued })
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, item.id),
        eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending),
        or(
          isNull(newsletterDeliveries.lastAttemptAt),
          lte(newsletterDeliveries.lastAttemptAt, staleBefore)
        )
      )
    )

  const queuedDeliveryIds = db
    .select({ id: newsletterDeliveries.id })
    .from(newsletterDeliveries)
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, item.id),
        eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.queued)
      )
    )
    .orderBy(asc(newsletterDeliveries.createdAt), asc(newsletterDeliveries.id))
    .limit(NEWSLETTER_DELIVERY_BATCH_SIZE)
    .for('update', { skipLocked: true })

  const claimed = await db
    .update(newsletterDeliveries)
    .set({
      attempts: sql`${newsletterDeliveries.attempts} + 1`,
      lastAttemptAt: new Date(),
      lastError: null,
      status: NEWSLETTER_DELIVERY_STATUS.sending,
    })
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, item.id),
        eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.queued),
        inArray(newsletterDeliveries.id, queuedDeliveryIds)
      )
    )
    .returning()

  if (claimed.length === 0) {
    return []
  }

  const subscriberIds = [...new Set(claimed.map((d) => d.subscriberId))]
  const subscribers = await db
    .select({
      active: newsletterSubscribers.active,
      email: newsletterSubscribers.email,
      id: newsletterSubscribers.id,
      subscribedAt: newsletterSubscribers.subscribedAt,
    })
    .from(newsletterSubscribers)
    .where(inArray(newsletterSubscribers.id, subscriberIds))

  const subscriberMap = new Map(subscribers.map((s) => [s.id, s]))

  return claimed.map((delivery) => ({
    delivery,
    subscriber: subscriberMap.get(delivery.subscriberId) ?? null,
  }))
}

async function deactivateSubscriberOnBounce(subscriberId: string) {
  await db.transaction(async (tx) => {
    const subscriber = await tx.query.newsletterSubscribers.findFirst({
      where: and(
        eq(newsletterSubscribers.id, subscriberId),
        eq(newsletterSubscribers.active, true)
      ),
      columns: { id: true, email: true },
    })

    if (!subscriber) {
      return
    }

    const [failedCountResult] = await tx
      .select({ failedCount: count() })
      .from(newsletterDeliveries)
      .where(
        and(
          eq(newsletterDeliveries.subscriberId, subscriberId),
          eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed)
        )
      )

    const failedCount = failedCountResult?.failedCount ?? 0

    if (failedCount < NEWSLETTER_DELIVERY_MAX_ATTEMPTS) {
      return
    }

    await tx
      .update(newsletterSubscribers)
      .set({
        active: false,
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, subscriberId))

    await recordNewsletterSubscriptionEvent(
      {
        email: subscriber.email,
        eventSource: NEWSLETTER_CONSENT_SOURCES.system,
        eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.unsubscribed,
        subscriberId: subscriber.id,
      },
      tx
    )
  })
}

async function markDeliverySent(deliveryId: string) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: null,
      sentAt: new Date(),
      status: NEWSLETTER_DELIVERY_STATUS.sent,
    })
    .where(eq(newsletterDeliveries.id, deliveryId))
}

async function markDeliveryFailed(deliveryId: string, error: unknown) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: normalizeDeliveryError(error),
      status: NEWSLETTER_DELIVERY_STATUS.failed,
    })
    .where(eq(newsletterDeliveries.id, deliveryId))
}

async function requeueDelivery(deliveryId: string, message: string) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: message,
      status: NEWSLETTER_DELIVERY_STATUS.queued,
    })
    .where(eq(newsletterDeliveries.id, deliveryId))
}

async function requeueSendingNewsletterDeliveries(newsletterId: string, message: string) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: message,
      status: NEWSLETTER_DELIVERY_STATUS.queued,
    })
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, newsletterId),
        eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending)
      )
    )
}

async function markInterruptedNewsletterDeliveries(newsletterId: string, error: unknown) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: normalizeDeliveryError(error),
      status: NEWSLETTER_DELIVERY_STATUS.failed,
    })
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, newsletterId),
        eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending)
      )
    )
}

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
          if (!(await isNewsletterDeliveryWorkerCurrent(item.id, workerToken))) {
            cancelled = true
            await requeueDelivery(delivery.id, 'Envío cancelado por administración')
            return
          }

          if (!subscriber || !subscriber.active) {
            await markDeliveryFailed(delivery.id, new Error('La suscripción ya no está activa'))
            await touchNewsletterDeliveryWorker(item.id, workerToken)
            return
          }

          try {
            await sendNewsletterEmail(
              item,
              subscriber,
              'Falta la configuración SMTP para enviar correos'
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

export async function claimNewsletterForSending(id: string): Promise<NewsletterRecord> {
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
    throw createError({ statusCode: 404, message: 'Newsletter no encontrada' })
  }

  if (!current.active) {
    throw createError({
      statusCode: 409,
      message: 'Habilita el envío antes de enviarla',
    })
  }

  if (current.sentAt) {
    throw createError({
      statusCode: 409,
      message: 'La newsletter ya se ha enviado',
    })
  }

  if (current.lastDeliveryWorkerToken) {
    throw createError({
      statusCode: 409,
      message: 'La newsletter ya se está enviando',
    })
  }

  throw createError({ statusCode: 409, message: 'No se puede enviar la newsletter' })
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
