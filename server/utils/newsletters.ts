import { createId } from '@paralleldrive/cuid2'
import { createError } from 'h3'
import { and, asc, eq, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletterDeliveries, newsletters, newsletterSubscribers } from '../db/schema'
import { sendNewsletterEmail } from './newsletterMailer'
import { logError, logInfo } from './logger'

const MONTH_INPUT_REGEX = /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-01$/
const NEWSLETTER_DELIVERY_BATCH_SIZE = 50
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
      lastDeliveryFailedRecipients:
        failedRecipients.length > 0 ? JSON.stringify(failedRecipients) : null,
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

  await db
    .insert(newsletterDeliveries)
    .select(
      db
        .select({
          newsletterId: sql<string>`${item.id}`.as('newsletterId'),
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
    .onConflictDoNothing()

  return setNewsletterDeliverySnapshot(item.id)
}

async function claimNewsletterDeliveryWorker(id: string) {
  const workerToken = createId()
  const now = new Date()
  const staleBefore = getNewsletterDeliveryStaleBefore()

  const [item] = await db
    .update(newsletters)
    .set({
      lastDeliveryHeartbeatAt: now,
      lastDeliveryWorkerToken: workerToken,
    })
    .where(
      and(
        eq(newsletters.id, id),
        eq(newsletters.sending, true),
        isNull(newsletters.sentAt),
        or(
          isNull(newsletters.lastDeliveryWorkerToken),
          lte(newsletters.lastDeliveryHeartbeatAt, staleBefore)
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

async function loadNewsletterDeliveryBatch(
  item: NewsletterRecord
): Promise<NewsletterDeliveryCandidate[]> {
  const staleBefore = getNewsletterDeliveryStaleBefore()

  const rows = await db
    .select({
      delivery: newsletterDeliveries,
      subscriber: newsletterSubscribers,
    })
    .from(newsletterDeliveries)
    .leftJoin(
      newsletterSubscribers,
      eq(newsletterSubscribers.id, newsletterDeliveries.subscriberId)
    )
    .where(
      and(
        eq(newsletterDeliveries.newsletterId, item.id),
        or(
          inArray(newsletterDeliveries.status, [
            NEWSLETTER_DELIVERY_STATUS.queued,
            NEWSLETTER_DELIVERY_STATUS.failed,
          ]),
          and(
            eq(newsletterDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending),
            lte(newsletterDeliveries.lastAttemptAt, staleBefore)
          )
        )
      )
    )
    .orderBy(asc(newsletterDeliveries.createdAt), asc(newsletterDeliveries.id))
    .limit(NEWSLETTER_DELIVERY_BATCH_SIZE)

  return rows.map((row) => ({
    delivery: row.delivery,
    subscriber: row.subscriber,
  }))
}

async function markDeliveryAttemptStarted(deliveryId: string) {
  await db
    .update(newsletterDeliveries)
    .set({
      attempts: sql`${newsletterDeliveries.attempts} + 1`,
      lastAttemptAt: new Date(),
      lastError: null,
      status: NEWSLETTER_DELIVERY_STATUS.sending,
    })
    .where(eq(newsletterDeliveries.id, deliveryId))
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

async function processNewsletterDeliveryBatch(id: string) {
  const claimedItem = await claimNewsletterDeliveryWorker(id)

  if (!claimedItem) {
    return false
  }

  try {
    await seedNewsletterDeliveries(claimedItem)
    const batch = await loadNewsletterDeliveryBatch(claimedItem)

    if (batch.length === 0) {
      const snapshot = await setNewsletterDeliverySnapshot(id)

      await releaseNewsletterDeliveryWorker(id, claimedItem.lastDeliveryWorkerToken ?? '', {
        lastDeliveryFinishedAt: new Date(),
        lastDeliveryHeartbeatAt: null,
        sending: false,
        sentAt: snapshot.sentCount > 0 ? new Date() : null,
      })

      logInfo('newsletter.delivery.completed', {
        newsletterId: id,
        sentCount: snapshot.sentCount,
        total: snapshot.total,
      })

      return true
    }

    for (const { delivery, subscriber } of batch) {
      await markDeliveryAttemptStarted(delivery.id)

      if (!subscriber || !subscriber.active) {
        await markDeliveryFailed(delivery.id, new Error('La suscripción ya no está activa'))
        continue
      }

      try {
        await sendNewsletterEmail(
          claimedItem,
          subscriber,
          'Falta la configuración SMTP para enviar correos'
        )
        await markDeliverySent(delivery.id)
      } catch (error) {
        await markDeliveryFailed(delivery.id, error)
        logError('newsletter.send.recipient', error, {
          deliveryId: delivery.id,
          newsletterId: claimedItem.id,
          subscriberEmail: subscriber.email,
        })
      }
    }

    const snapshot = await setNewsletterDeliverySnapshot(id)
    const completedBatch = batch.length < NEWSLETTER_DELIVERY_BATCH_SIZE

    await releaseNewsletterDeliveryWorker(id, claimedItem.lastDeliveryWorkerToken ?? '', {
      lastDeliveryFinishedAt: completedBatch ? new Date() : null,
      lastDeliveryHeartbeatAt: completedBatch ? null : new Date(),
      sending: completedBatch ? false : true,
      sentAt: completedBatch && snapshot.sentCount > 0 ? new Date() : null,
    })

    return true
  } catch (error) {
    logError('newsletter.delivery.batch', error, { newsletterId: id })
    await releaseNewsletterDeliveryWorker(id, claimedItem.lastDeliveryWorkerToken ?? '', {
      lastDeliveryHeartbeatAt: null,
    })
    return false
  }
}

export async function processPendingNewsletterDeliveries() {
  const pendingItems = await db.query.newsletters.findMany({
    columns: {
      id: true,
    },
    orderBy: asc(newsletters.lastDeliveryStartedAt),
    where: and(eq(newsletters.sending, true), isNull(newsletters.sentAt)),
  })

  for (const item of pendingItems) {
    await processNewsletterDeliveryBatch(item.id)
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
  const now = new Date()
  const [item] = await db
    .update(newsletters)
    .set({
      sending: true,
      lastDeliveryErrorCount: 0,
      lastDeliveryFailedRecipients: null,
      lastDeliveryFinishedAt: null,
      lastDeliveryHeartbeatAt: null,
      lastDeliverySentCount: 0,
      lastDeliveryStartedAt: now,
      lastDeliveryTotal: 0,
      lastDeliveryWorkerToken: null,
    })
    .where(
      and(
        eq(newsletters.id, id),
        eq(newsletters.active, true),
        eq(newsletters.sending, false),
        isNull(newsletters.sentAt)
      )
    )
    .returning()

  if (item) {
    await db.delete(newsletterDeliveries).where(eq(newsletterDeliveries.newsletterId, item.id))
    await seedNewsletterDeliveries(item)

    const queuedItem = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, item.id),
    })

    return queuedItem ?? item
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

  if (current.sending) {
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
  await processPendingNewsletterDeliveries()

  const updatedItem = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })
  const result = await setNewsletterDeliverySnapshot(id)

  return {
    item: updatedItem ?? item,
    result: {
      ...result,
      sent: result.sentCount > 0,
    },
  }
}
