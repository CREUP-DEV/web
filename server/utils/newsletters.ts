import { createId } from '@paralleldrive/cuid2'
import { createError } from 'h3'
import { and, asc, eq, inArray, isNotNull, isNull, lt, lte, ne, or, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletterDeliveries, newsletters, newsletterSubscribers } from '../db/schema'
import { sendNewsletterEmail } from './newsletterMailer'
import { logError, logInfo } from './logger'

const MONTH_INPUT_REGEX = /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-01$/
const NEWSLETTER_DELIVERY_BATCH_SIZE = 50
const NEWSLETTER_DELIVERY_INSERT_BATCH_SIZE = 1000
const NEWSLETTER_DELIVERY_WORKER_STALE_MS = 2 * 60 * 1000
const NEWSLETTER_DELIVERY_STATUS = {
  failed: 'failed',
  queued: 'queued',
  sending: 'sending',
  sent: 'sent',
} as const

export const NEWSLETTER_DELIVERY_MAX_ATTEMPTS = 3

type NewsletterRecord = typeof newsletters.$inferSelect

interface NewsletterDeliveryCandidate {
  delivery: typeof newsletterDeliveries.$inferSelect
  subscriber: Pick<
    typeof newsletterSubscribers.$inferSelect,
    'active' | 'email' | 'id' | 'unsubscribeToken'
  > | null
}

export interface NewsletterDeliveryResult {
  errorCount: number
  failedRecipients: string[]
  sent: boolean
  sentCount: number
  total: number
}

function padMonth(month: number): string {
  return String(month).padStart(2, '0')
}

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
  const [summary] = await db
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

  const failedRows = await db
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

  await db
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
}

async function seedNewsletterDeliveries(item: NewsletterRecord) {
  const startedAt = item.lastDeliveryStartedAt ?? new Date()

  if (!item.lastDeliveryStartedAt) {
    await db
      .update(newsletters)
      .set({ lastDeliveryStartedAt: startedAt })
      .where(eq(newsletters.id, item.id))
  }

  const activeSubscribers = await db
    .select({
      subscriberId: newsletterSubscribers.id,
    })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.active, true),
        lte(newsletterSubscribers.subscribedAt, startedAt)
      )
    )

  // Keep inserts in batches to avoid oversized parameterized queries.
  for (
    let index = 0;
    index < activeSubscribers.length;
    index += NEWSLETTER_DELIVERY_INSERT_BATCH_SIZE
  ) {
    const batch = activeSubscribers.slice(index, index + NEWSLETTER_DELIVERY_INSERT_BATCH_SIZE)

    await db
      .insert(newsletterDeliveries)
      .values(
        batch.map(({ subscriberId }) => ({
          newsletterId: item.id,
          subscriberId,
        }))
      )
      .onConflictDoNothing()
  }

  await db
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

  return setNewsletterDeliverySnapshot(item.id)
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
        // Claim when idle (no worker token) or when the existing worker is stale
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

  // Reset stale 'sending' rows so they can be retried in this pass
  await db
    .update(newsletterDeliveries)
    .set({ status: NEWSLETTER_DELIVERY_STATUS.queued })
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, item.id),
        eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending),
        lte(newsletterDeliveries.lastAttemptAt, staleBefore)
      )
    )

  // Atomically claim a batch: UPDATE wins the race so a second concurrent worker
  // finds no 'queued' rows and claims nothing for the same newsletter
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
        inArray(
          newsletterDeliveries.id,
          db
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
        )
      )
    )
    .returning()

  if (claimed.length === 0) {
    return []
  }

  // Load subscriber data for the claimed deliveries
  const subscriberIds = [...new Set(claimed.map((d) => d.subscriberId))]
  const subscribers = await db
    .select({
      active: newsletterSubscribers.active,
      email: newsletterSubscribers.email,
      id: newsletterSubscribers.id,
      unsubscribeToken: newsletterSubscribers.unsubscribeToken,
    })
    .from(newsletterSubscribers)
    .where(inArray(newsletterSubscribers.id, subscriberIds))

  const subscriberMap = new Map(subscribers.map((s) => [s.id, s]))

  return claimed.map((delivery) => ({
    delivery,
    subscriber: subscriberMap.get(delivery.subscriberId) ?? null,
  }))
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

export async function processNewsletterDeliveryRun(item: NewsletterRecord) {
  const workerToken = item.lastDeliveryWorkerToken ?? ''

  if (!workerToken) {
    return false
  }

  try {
    await seedNewsletterDeliveries(item)
    await touchNewsletterDeliveryWorker(item.id, workerToken)

    while (true) {
      const batch = await claimNewsletterDeliveryBatch(item)

      if (batch.length === 0) {
        break
      }

      for (const { delivery, subscriber } of batch) {
        if (!subscriber || !subscriber.active) {
          await markDeliveryFailed(delivery.id, new Error('La suscripción ya no está activa'))
          await touchNewsletterDeliveryWorker(item.id, workerToken)
          continue
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
            subscriberEmail: subscriber.email,
          })
        } finally {
          await touchNewsletterDeliveryWorker(item.id, workerToken)
        }
      }
    }

    const snapshot = await setNewsletterDeliverySnapshot(item.id)
    const now = new Date()
    const completedSuccessfully = snapshot.total === 0 || snapshot.errorCount === 0

    await releaseNewsletterDeliveryWorker(item.id, workerToken, {
      lastDeliveryFinishedAt: now,
      lastDeliveryHeartbeatAt: null,
      sentAt: completedSuccessfully ? now : null,
    })

    logInfo('newsletter.delivery.completed', {
      completedSuccessfully,
      errorCount: snapshot.errorCount,
      newsletterId: item.id,
      sentCount: snapshot.sentCount,
      total: snapshot.total,
    })

    return completedSuccessfully
  } catch (error) {
    logError('newsletter.delivery.batch', error, { newsletterId: item.id })
    await releaseNewsletterDeliveryWorker(item.id, workerToken, {
      lastDeliveryHeartbeatAt: null,
    })
    return false
  }
}

export async function processPendingNewsletterDeliveries() {
  // A non-null worker token means delivery is in progress (or was interrupted).
  const pendingItems = await db.query.newsletters.findMany({
    orderBy: asc(newsletters.lastDeliveryStartedAt),
    where: and(isNotNull(newsletters.lastDeliveryWorkerToken), isNull(newsletters.sentAt)),
  })

  for (const item of pendingItems) {
    await processNewsletterDeliveryRun(item)
  }
}

export function normalizeNewsletterMonthInput(value: string) {
  const match = MONTH_INPUT_REGEX.exec(value)

  if (!match?.groups) {
    throw createError({ statusCode: 400, message: 'El mes no es válido' })
  }

  const year = Number(match.groups.year)
  const month = Number(match.groups.month)
  const monthKey = `${year}-${padMonth(month)}`

  return {
    monthDate: new Date(Date.UTC(year, month - 1, 1)),
    monthKey,
  }
}

export function monthKeyToDate(monthKey: string): Date {
  const [year = 1970, month = 1] = monthKey.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, 1))
}

export async function assertNewsletterMonthAvailable(monthKey: string, excludeId?: string) {
  const conditions = [eq(newsletters.monthKey, monthKey)]

  if (excludeId) {
    conditions.push(ne(newsletters.id, excludeId))
  }

  const existing = await db.query.newsletters.findFirst({
    where: conditions.length === 1 ? conditions[0] : and(...conditions),
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Ya existe una newsletter para ese mes',
    })
  }
}

export async function claimNewsletterForSending(id: string): Promise<NewsletterRecord> {
  const claimedItem = await claimNewsletterDeliveryWorker(id)

  if (claimedItem) {
    const preparedSnapshot = await seedNewsletterDeliveries(claimedItem)
    const currentItem = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, claimedItem.id),
    })

    if (currentItem) {
      return currentItem
    }

    return {
      ...claimedItem,
      lastDeliveryErrorCount: preparedSnapshot.errorCount,
      lastDeliveryFailedRecipients:
        preparedSnapshot.failedRecipients.length > 0 ? preparedSnapshot.failedRecipients : null,
      lastDeliverySentCount: preparedSnapshot.sentCount,
      lastDeliveryTotal: preparedSnapshot.total,
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
      message: 'Activa la newsletter antes de enviarla',
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
  const sent = await processNewsletterDeliveryRun(item)
  const updatedItem = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })
  const result = await setNewsletterDeliverySnapshot(id)

  return {
    item: updatedItem ?? item,
    result: {
      ...result,
      sent,
    },
  }
}
