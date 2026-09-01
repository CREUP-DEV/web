import { createId } from '@paralleldrive/cuid2'
import { and, asc, count, eq, inArray, isNull, lt, lte, or, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  newsletterCampaignDeliveries,
  newsletterCampaigns,
  newsletterSubscribers,
} from '../db/schema'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../utils/newsletter/newsletterSubscribers'
import {
  NEWSLETTER_DELIVERY_MAX_ATTEMPTS,
  NEWSLETTER_DELIVERY_STATUS,
  getNewsletterDeliveryStaleBefore,
} from './newsletterDeliveryShared'
import type { NewsletterCampaignRecord } from './newsletterCampaignDeliveryLease'

/**
 * Delivery rows of a campaign. Mirrors the PDF-era repository against
 * `newsletter_campaign_deliveries`, with one addition the campaign state machine needs: the summary
 * also reports what is still pending, because "finished with nothing pending" is what separates
 * `sent` from `failed`.
 */

const NEWSLETTER_DELIVERY_SEED_CHUNK_SIZE = 500
const NEWSLETTER_DELIVERY_BATCH_SIZE = 50

/**
 * Either the pool or a transaction the caller is already inside. The admin endpoints run these
 * writes inside the transaction that holds the campaign row lock; the worker runs them on the pool.
 */
type CampaignDeliveryWriter = Pick<typeof db, 'update'>

export interface NewsletterCampaignDeliveryCandidate {
  delivery: typeof newsletterCampaignDeliveries.$inferSelect
  subscriber: Pick<
    typeof newsletterSubscribers.$inferSelect,
    'active' | 'email' | 'id' | 'locale' | 'subscribedAt'
  > | null
}

export interface NewsletterCampaignDeliverySummary {
  errorCount: number
  failedRecipients: string[]
  /** Deliveries still `queued` or `sending`. A run that ends with any of these is not `sent`. */
  pendingCount: number
  sentCount: number
  total: number
}

function normalizeDeliveryError(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500)
  }

  return 'No se pudo enviar el correo'
}

const countWhen = (status: string) =>
  sql<number>`coalesce(sum(case when ${newsletterCampaignDeliveries.status} = ${status} then 1 else 0 end), 0)`.mapWith(
    Number
  )

export async function setNewsletterCampaignDeliverySnapshot(
  campaignId: string
): Promise<NewsletterCampaignDeliverySummary> {
  return db.transaction(async (tx) => {
    const [summary] = await tx
      .select({
        errorCount: countWhen(NEWSLETTER_DELIVERY_STATUS.failed),
        queuedCount: countWhen(NEWSLETTER_DELIVERY_STATUS.queued),
        sendingCount: countWhen(NEWSLETTER_DELIVERY_STATUS.sending),
        sentCount: countWhen(NEWSLETTER_DELIVERY_STATUS.sent),
        total: sql<number>`count(*)`.mapWith(Number),
      })
      .from(newsletterCampaignDeliveries)
      .where(eq(newsletterCampaignDeliveries.campaignId, campaignId))

    const failedRows = await tx
      .select({ email: newsletterSubscribers.email })
      .from(newsletterCampaignDeliveries)
      .innerJoin(
        newsletterSubscribers,
        eq(newsletterSubscribers.id, newsletterCampaignDeliveries.subscriberId)
      )
      .where(
        and(
          eq(newsletterCampaignDeliveries.campaignId, campaignId),
          eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed)
        )
      )
      .orderBy(asc(newsletterSubscribers.email))

    const failedRecipients = failedRows.map((row) => row.email)

    await tx
      .update(newsletterCampaigns)
      .set({
        lastDeliveryErrorCount: summary?.errorCount ?? 0,
        lastDeliveryFailedRecipients: failedRecipients.length > 0 ? failedRecipients : null,
        lastDeliverySentCount: summary?.sentCount ?? 0,
        lastDeliveryTotal: summary?.total ?? 0,
      })
      .where(eq(newsletterCampaigns.id, campaignId))

    return {
      errorCount: summary?.errorCount ?? 0,
      failedRecipients,
      pendingCount: (summary?.queuedCount ?? 0) + (summary?.sendingCount ?? 0),
      sentCount: summary?.sentCount ?? 0,
      total: summary?.total ?? 0,
    }
  })
}

/**
 * Creates the delivery row of every subscriber active when the send started. Idempotent, so a
 * resumed run adds nobody twice; `subscribed_at <= started_at` keeps the audience frozen to the
 * moment the send was requested.
 */
export async function seedNewsletterCampaignDeliveries(campaign: NewsletterCampaignRecord) {
  const startedAt = campaign.lastDeliveryStartedAt ?? new Date()

  await db.transaction(async (tx) => {
    if (!campaign.lastDeliveryStartedAt) {
      await tx
        .update(newsletterCampaigns)
        .set({ lastDeliveryStartedAt: startedAt })
        .where(eq(newsletterCampaigns.id, campaign.id))
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
        .insert(newsletterCampaignDeliveries)
        .values(
          chunk.map((row) => ({
            id: createId(),
            campaignId: campaign.id,
            subscriberId: row.id,
          }))
        )
        .onConflictDoNothing({
          target: [
            newsletterCampaignDeliveries.campaignId,
            newsletterCampaignDeliveries.subscriberId,
          ],
        })
    }

    await tx
      .update(newsletterCampaignDeliveries)
      .set({
        lastError: null,
        status: NEWSLETTER_DELIVERY_STATUS.queued,
      })
      .where(
        and(
          eq(newsletterCampaignDeliveries.campaignId, campaign.id),
          eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed),
          lt(newsletterCampaignDeliveries.attempts, NEWSLETTER_DELIVERY_MAX_ATTEMPTS)
        )
      )
  })

  return setNewsletterCampaignDeliverySnapshot(campaign.id)
}

/**
 * Clears the retry state of the deliveries that failed, so "resend to the failures" starts them
 * from zero attempts. Only `failed` rows: anything still queued is already going to be sent, and
 * a `sending` row belongs to a live worker.
 */
export async function resetFailedNewsletterCampaignDeliveries(
  campaignId: string,
  executor: CampaignDeliveryWriter = db
) {
  const reset = await executor
    .update(newsletterCampaignDeliveries)
    .set({
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      sentAt: null,
      status: NEWSLETTER_DELIVERY_STATUS.queued,
    })
    .where(
      and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId),
        eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed)
      )
    )
    .returning({ id: newsletterCampaignDeliveries.id })

  return reset.length
}

export async function claimNewsletterCampaignDeliveryBatch(
  campaignId: string
): Promise<NewsletterCampaignDeliveryCandidate[]> {
  const staleBefore = getNewsletterDeliveryStaleBefore()

  await db
    .update(newsletterCampaignDeliveries)
    .set({ status: NEWSLETTER_DELIVERY_STATUS.queued })
    .where(
      and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId),
        eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending),
        or(
          isNull(newsletterCampaignDeliveries.lastAttemptAt),
          lte(newsletterCampaignDeliveries.lastAttemptAt, staleBefore)
        )
      )
    )

  const queuedDeliveryIds = db
    .select({ id: newsletterCampaignDeliveries.id })
    .from(newsletterCampaignDeliveries)
    .where(
      and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId),
        eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.queued)
      )
    )
    .orderBy(asc(newsletterCampaignDeliveries.createdAt), asc(newsletterCampaignDeliveries.id))
    .limit(NEWSLETTER_DELIVERY_BATCH_SIZE)
    .for('update', { skipLocked: true })

  const claimed = await db
    .update(newsletterCampaignDeliveries)
    .set({
      attempts: sql`${newsletterCampaignDeliveries.attempts} + 1`,
      lastAttemptAt: new Date(),
      lastError: null,
      status: NEWSLETTER_DELIVERY_STATUS.sending,
    })
    .where(
      and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId),
        eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.queued),
        inArray(newsletterCampaignDeliveries.id, queuedDeliveryIds)
      )
    )
    .returning()

  if (claimed.length === 0) {
    return []
  }

  const subscriberIds = [...new Set(claimed.map((delivery) => delivery.subscriberId))]
  const subscribers = await db
    .select({
      active: newsletterSubscribers.active,
      email: newsletterSubscribers.email,
      id: newsletterSubscribers.id,
      locale: newsletterSubscribers.locale,
      subscribedAt: newsletterSubscribers.subscribedAt,
    })
    .from(newsletterSubscribers)
    .where(inArray(newsletterSubscribers.id, subscriberIds))

  const subscriberMap = new Map(subscribers.map((subscriber) => [subscriber.id, subscriber]))

  return claimed.map((delivery) => ({
    delivery,
    subscriber: subscriberMap.get(delivery.subscriberId) ?? null,
  }))
}

export async function deactivateCampaignSubscriberOnBounce(subscriberId: string) {
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
      .from(newsletterCampaignDeliveries)
      .where(
        and(
          eq(newsletterCampaignDeliveries.subscriberId, subscriberId),
          eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.failed)
        )
      )

    if ((failedCountResult?.failedCount ?? 0) < NEWSLETTER_DELIVERY_MAX_ATTEMPTS) {
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

export async function markCampaignDeliverySent(deliveryId: string) {
  await db
    .update(newsletterCampaignDeliveries)
    .set({
      lastError: null,
      sentAt: new Date(),
      status: NEWSLETTER_DELIVERY_STATUS.sent,
    })
    .where(eq(newsletterCampaignDeliveries.id, deliveryId))
}

export async function markCampaignDeliveryFailed(deliveryId: string, error: unknown) {
  await db
    .update(newsletterCampaignDeliveries)
    .set({
      lastError: normalizeDeliveryError(error),
      status: NEWSLETTER_DELIVERY_STATUS.failed,
    })
    .where(eq(newsletterCampaignDeliveries.id, deliveryId))
}

export async function requeueSendingCampaignDeliveries(
  campaignId: string,
  message: string,
  executor: CampaignDeliveryWriter = db
) {
  await executor
    .update(newsletterCampaignDeliveries)
    .set({
      lastError: message,
      status: NEWSLETTER_DELIVERY_STATUS.queued,
    })
    .where(
      and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId),
        eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending)
      )
    )
}

export async function markInterruptedCampaignDeliveries(campaignId: string, error: unknown) {
  await db
    .update(newsletterCampaignDeliveries)
    .set({
      lastError: normalizeDeliveryError(error),
      status: NEWSLETTER_DELIVERY_STATUS.failed,
    })
    .where(
      and(
        eq(newsletterCampaignDeliveries.campaignId, campaignId),
        eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending)
      )
    )
}
