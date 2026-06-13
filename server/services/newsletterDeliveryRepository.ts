import { createId } from '@paralleldrive/cuid2'
import { and, asc, count, eq, inArray, lt, lte, or, isNull, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletterDeliveries, newsletters, newsletterSubscribers } from '../db/schema'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../utils/newsletter/newsletterSubscribers'
import { NEWSLETTER_DELIVERY_MAX_ATTEMPTS } from '../utils/newsletter/newsletters'
import { getNewsletterDeliveryStaleBefore } from './newsletterDeliveryLease'

// Chunk size for seeding delivery rows (insert values). Separate from per-send batch size below.
const NEWSLETTER_DELIVERY_SEED_CHUNK_SIZE = 500
// 50 per batch: keeps each DB transaction and SMTP burst manageable; too large increases memory pressure per cycle
const NEWSLETTER_DELIVERY_BATCH_SIZE = 50
export const NEWSLETTER_DELIVERY_STATUS = {
  failed: 'failed',
  queued: 'queued',
  sending: 'sending',
  sent: 'sent',
} as const

export type NewsletterRecord = typeof newsletters.$inferSelect

export interface NewsletterDeliveryCandidate {
  delivery: typeof newsletterDeliveries.$inferSelect
  subscriber: Pick<
    typeof newsletterSubscribers.$inferSelect,
    'active' | 'email' | 'id' | 'subscribedAt'
  > | null
}

function normalizeDeliveryError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500)
  }

  return 'No se pudo enviar el correo'
}

export async function setNewsletterDeliverySnapshot(newsletterId: string) {
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

export async function seedNewsletterDeliveries(item: NewsletterRecord) {
  const startedAt = item.lastDeliveryStartedAt ?? new Date()

  await db.transaction(async (tx) => {
    if (!item.lastDeliveryStartedAt) {
      await tx
        .update(newsletters)
        .set({ lastDeliveryStartedAt: startedAt })
        .where(eq(newsletters.id, item.id))
    }

    const subscriberRows = await tx
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(
        and(
          eq(newsletterSubscribers.active, true),
          lte(newsletterSubscribers.subscribedAt, startedAt)
        )
      )

    for (let i = 0; i < subscriberRows.length; i += NEWSLETTER_DELIVERY_SEED_CHUNK_SIZE) {
      const chunk = subscriberRows.slice(i, i + NEWSLETTER_DELIVERY_SEED_CHUNK_SIZE)
      await tx
        .insert(newsletterDeliveries)
        .values(
          chunk.map((row) => ({
            id: createId(),
            newsletterId: item.id,
            subscriberId: row.id,
          }))
        )
        .onConflictDoNothing({
          target: [newsletterDeliveries.newsletterId, newsletterDeliveries.subscriberId],
        })
    }

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

export async function resetNewsletterDeliveryRetryState(newsletterId: string) {
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

export async function claimNewsletterDeliveryBatch(
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

export async function deactivateSubscriberOnBounce(subscriberId: string) {
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

export async function markDeliverySent(deliveryId: string) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: null,
      sentAt: new Date(),
      status: NEWSLETTER_DELIVERY_STATUS.sent,
    })
    .where(eq(newsletterDeliveries.id, deliveryId))
}

export async function markDeliveryFailed(deliveryId: string, error: unknown) {
  await db
    .update(newsletterDeliveries)
    .set({
      lastError: normalizeDeliveryError(error),
      status: NEWSLETTER_DELIVERY_STATUS.failed,
    })
    .where(eq(newsletterDeliveries.id, deliveryId))
}

export async function requeueSendingNewsletterDeliveries(newsletterId: string, message: string) {
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

export async function markInterruptedNewsletterDeliveries(newsletterId: string, error: unknown) {
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
