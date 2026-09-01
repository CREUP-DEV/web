import { createId } from '@paralleldrive/cuid2'
import { and, eq, inArray, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletterCampaigns } from '../db/schema'
import { getNewsletterDeliveryStaleBefore } from './newsletterDeliveryShared'
import type { NewsletterCampaignExecutor } from '../utils/newsletter/newsletterCampaigns'
import {
  NEWSLETTER_CAMPAIGN_ACTIVE_STATUSES,
  type NewsletterCampaignStatus,
} from '~~/shared/constants/newsletterCampaigns'

/**
 * Worker lease over a campaign. Same shape as the PDF-era lease, with one rule the campaigns table
 * enforces and the old one could not: `status` and the worker token are bound by a biconditional
 * CHECK, so every statement here writes both at once. Claiming the token first and setting the
 * status afterwards would leave an intermediate row that violates the constraint.
 */

export type NewsletterCampaignRecord = typeof newsletterCampaigns.$inferSelect

/** Values a release may set. `status` is required so no release can leave the pair inconsistent. */
export interface NewsletterCampaignReleaseValues {
  status: Extract<NewsletterCampaignStatus, 'sent' | 'failed'>
  sentAt: Date | null
  lastDeliveryFinishedAt: Date
  lastDeliveryHeartbeatAt: null
}

export async function touchNewsletterCampaignDeliveryWorker(
  campaignId: string,
  workerToken: string
) {
  await db
    .update(newsletterCampaigns)
    .set({ lastDeliveryHeartbeatAt: new Date() })
    .where(
      and(
        eq(newsletterCampaigns.id, campaignId),
        eq(newsletterCampaigns.lastDeliveryWorkerToken, workerToken)
      )
    )
}

export async function isNewsletterCampaignDeliveryWorkerCurrent(
  campaignId: string,
  workerToken: string
) {
  const campaign = await db.query.newsletterCampaigns.findFirst({
    where: eq(newsletterCampaigns.id, campaignId),
    columns: {
      id: true,
      lastDeliveryFinishedAt: true,
      lastDeliveryWorkerToken: true,
    },
  })

  return Boolean(
    campaign &&
    campaign.lastDeliveryFinishedAt === null &&
    campaign.lastDeliveryWorkerToken === workerToken
  )
}

/**
 * Takes the lease and moves the campaign to `queued` in a single statement.
 *
 * Runs on the caller's transaction handle, not on `db`: the send endpoint claims inside the same
 * transaction that froze the snapshot, so a crash between the two can never leave a campaign
 * queued against content that was never written.
 *
 * `sent_at IS NULL` is the whole gate: a finished campaign can never be claimed again, which is
 * why a run that leaves failures ends in `failed` instead of `sent`.
 */
export async function claimNewsletterCampaignDeliveryWorker(
  tx: NewsletterCampaignExecutor,
  campaignId: string
): Promise<NewsletterCampaignRecord | null> {
  const workerToken = createId()
  const now = new Date()
  const staleBefore = getNewsletterDeliveryStaleBefore()

  const [campaign] = await tx
    .update(newsletterCampaigns)
    .set({
      status: 'queued',
      lastDeliveryFinishedAt: null,
      lastDeliveryHeartbeatAt: now,
      lastDeliveryStartedAt: sql`coalesce(${newsletterCampaigns.lastDeliveryStartedAt}, ${now})`,
      lastDeliveryWorkerToken: workerToken,
    })
    .where(
      and(
        eq(newsletterCampaigns.id, campaignId),
        isNull(newsletterCampaigns.sentAt),
        or(
          isNull(newsletterCampaigns.lastDeliveryWorkerToken),
          and(
            isNotNull(newsletterCampaigns.lastDeliveryWorkerToken),
            or(
              isNull(newsletterCampaigns.lastDeliveryHeartbeatAt),
              lte(newsletterCampaigns.lastDeliveryHeartbeatAt, staleBefore)
            )
          )
        )
      )
    )
    .returning()

  return campaign ?? null
}

/**
 * `queued → sending`, in the one statement §4.6 requires. A zero-row result means the lease is no
 * longer ours — cancelled, or reclaimed by another instance — and the run must not start.
 */
export async function markNewsletterCampaignDeliverySending(
  campaignId: string,
  workerToken: string
) {
  const updated = await db
    .update(newsletterCampaigns)
    .set({
      status: 'sending',
      lastDeliveryHeartbeatAt: new Date(),
    })
    .where(
      and(
        eq(newsletterCampaigns.id, campaignId),
        eq(newsletterCampaigns.lastDeliveryWorkerToken, workerToken),
        inArray(newsletterCampaigns.status, [...NEWSLETTER_CAMPAIGN_ACTIVE_STATUSES])
      )
    )
    .returning({ id: newsletterCampaigns.id })

  return updated.length > 0
}

/**
 * Releases the lease and writes the terminal status in the same statement.
 *
 * Still conditioned on the token, and that is load-bearing: an admin who cancels while the run is
 * finishing has already nulled the token and set `paused`, so this update matches nothing and the
 * cancellation stands.
 */
export async function releaseNewsletterCampaignDeliveryWorker(
  campaignId: string,
  workerToken: string,
  values: NewsletterCampaignReleaseValues
) {
  await db
    .update(newsletterCampaigns)
    .set({
      ...values,
      lastDeliveryWorkerToken: null,
    })
    .where(
      and(
        eq(newsletterCampaigns.id, campaignId),
        eq(newsletterCampaigns.lastDeliveryWorkerToken, workerToken)
      )
    )
}
