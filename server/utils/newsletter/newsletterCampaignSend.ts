import { createError, type H3Event } from 'h3'
import { and, eq, isNotNull } from 'drizzle-orm'
import { newsletterCampaignItems, newsletterCampaigns } from '../../db/schema'
import { runAdminCrudTransaction } from '../admin/adminCrud'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'
import { getRequiredSiteUrl } from '../core/runtimeConfig'
import { normalizeBaseUrl } from '../core/urlBuilder'
import { logError } from '../core/logger'
import {
  buildCampaignRenderContext,
  findOversizedCampaignLocales,
} from '../email/newsletterCampaignRender'
import { projectCampaignItems, type CampaignItemInput } from './campaignSnapshot'
import { loadNewsletterCampaign, type NewsletterCampaignRecord } from './newsletterCampaigns'
import { claimNewsletterCampaignDeliveryWorker } from '../../services/newsletterCampaignDeliveryLease'
import {
  requeueSendingCampaignDeliveries,
  resetFailedNewsletterCampaignDeliveries,
} from '../../services/newsletterCampaignDeliveryRepository'
import {
  enqueueNewsletterCampaignSendJob,
  removeNewsletterCampaignSendJob,
} from '../core/backgroundJobs'
import {
  NEWSLETTER_CAMPAIGN_ACTIVE_STATUSES,
  NEWSLETTER_CAMPAIGN_RESUMABLE_STATUSES,
  type NewsletterCampaignItemType,
} from '~~/shared/constants/newsletterCampaigns'
import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'

/**
 * The three state transitions of a send — start, resume, cancel — and the PostgreSQL/BullMQ
 * boundary that follows them.
 *
 * All three take the campaign's row lock first, and all three write `status` in the same statement
 * as the worker token: the table's biconditional CHECKs reject any row where the two disagree, so
 * there is no such thing as claiming the lease now and setting the status afterwards.
 */

const CANCELLED_MESSAGE = 'Envío cancelado por administración'

const toCampaignItemInputs = (items: NewsletterCampaignRecord['items']): CampaignItemInput[] =>
  items.map((item) => ({
    id: item.id,
    itemType: item.itemType as NewsletterCampaignItemType,
    itemId: item.itemId,
    overrides: item.translations.map((translation) => ({
      locale: translation.locale,
      titleOverride: translation.titleOverride,
      excerptOverride: translation.excerptOverride,
    })),
  }))

/**
 * Validate, freeze and queue, in one transaction.
 *
 * The order is the point: the row lock stops two simultaneous sends, `projectCampaignItems` locks
 * every referenced piece before reading it, and a piece that is gone or unpublished blocks the send
 * with the list of what is wrong. Inside the worker there would be nobody left to tell.
 */
export async function freezeAndQueueNewsletterCampaign(event: H3Event, id: string) {
  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(event))

  return runAdminCrudTransaction(
    async (tx) => {
      const [locked] = await tx
        .select({ id: newsletterCampaigns.id, status: newsletterCampaigns.status })
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, id))
        .for('update')

      if (!locked) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, 'campaignNotFound'),
        })
      }

      if (locked.status !== 'draft') {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignNotDraft'),
        })
      }

      const campaign = await loadNewsletterCampaign(id, tx)

      if (!campaign) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, 'campaignNotFound'),
        })
      }

      if (campaign.items.length === 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignNoItems'),
        })
      }

      const hasDefaultSubject = campaign.translations.some(
        (translation) =>
          translation.locale === DEFAULT_LOCALE_CODE && translation.subject.trim().length > 0
      )

      if (!hasDefaultSubject) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignMissingDefaultTranslation'),
        })
      }

      const { snapshots, unavailable } = await projectCampaignItems(
        tx,
        toCampaignItemInputs(campaign.items)
      )

      if (unavailable.length > 0) {
        // Machine-readable reasons, untranslated: the admin UI localizes them next to the piece.
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignItemsUnavailable'),
          data: { unavailable },
        })
      }

      const oversized = findOversizedCampaignLocales(
        buildCampaignRenderContext({
          campaignId: id,
          siteUrl,
          links: 'tracked',
          unsubscribeUrl: null,
          translations: campaign.translations,
          items: campaign.items.map((item) => ({
            id: item.id,
            itemType: item.itemType,
            snapshot: snapshots.get(item.id) ?? null,
          })),
        })
      )

      if (oversized.length > 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignEmailTooLarge'),
          data: { oversized },
        })
      }

      for (const [campaignItemId, snapshot] of snapshots) {
        await tx
          .update(newsletterCampaignItems)
          .set({ snapshot })
          .where(
            and(
              eq(newsletterCampaignItems.id, campaignItemId),
              eq(newsletterCampaignItems.campaignId, id)
            )
          )
      }

      const claimed = await claimNewsletterCampaignDeliveryWorker(tx, id)

      if (!claimed) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignCannotSend'),
        })
      }

      return claimed
    },
    () => getAdminApiErrorMessage(event, 'campaignSendFailed')
  )
}

/**
 * `paused → queued` just retakes the lease; `failed → queued` clears the retry state of the
 * deliveries that failed first, so they start again from zero attempts. Neither recomputes the
 * snapshot: what was frozen is what gets sent.
 */
export async function resumeNewsletterCampaign(event: H3Event, id: string) {
  return runAdminCrudTransaction(
    async (tx) => {
      const [locked] = await tx
        .select({ id: newsletterCampaigns.id, status: newsletterCampaigns.status })
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, id))
        .for('update')

      if (!locked) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, 'campaignNotFound'),
        })
      }

      if (!NEWSLETTER_CAMPAIGN_RESUMABLE_STATUSES.some((status) => status === locked.status)) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignNotResumable'),
        })
      }

      if (locked.status === 'failed') {
        await resetFailedNewsletterCampaignDeliveries(id, tx)
      }

      const claimed = await claimNewsletterCampaignDeliveryWorker(tx, id)

      if (!claimed) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignCannotSend'),
        })
      }

      return claimed
    },
    () => getAdminApiErrorMessage(event, 'campaignSendFailed')
  )
}

/**
 * Cancelling drops the lease and leaves the campaign `paused`, keeping snapshot and deliveries.
 * The worker notices on its next iteration; its own release is conditioned on the token it no
 * longer holds, so a late finish cannot overwrite this.
 */
export async function cancelNewsletterCampaignSend(event: H3Event, id: string) {
  const cancelled = await runAdminCrudTransaction(
    async (tx) => {
      const [locked] = await tx
        .select({
          id: newsletterCampaigns.id,
          status: newsletterCampaigns.status,
          lastDeliveryWorkerToken: newsletterCampaigns.lastDeliveryWorkerToken,
        })
        .from(newsletterCampaigns)
        .where(eq(newsletterCampaigns.id, id))
        .for('update')

      if (!locked) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, 'campaignNotFound'),
        })
      }

      if (
        !NEWSLETTER_CAMPAIGN_ACTIVE_STATUSES.some((status) => status === locked.status) ||
        !locked.lastDeliveryWorkerToken
      ) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'campaignNotSending'),
        })
      }

      await tx
        .update(newsletterCampaigns)
        .set({
          status: 'paused',
          lastDeliveryFinishedAt: new Date(),
          lastDeliveryHeartbeatAt: null,
          lastDeliveryWorkerToken: null,
        })
        .where(
          and(
            eq(newsletterCampaigns.id, id),
            isNotNull(newsletterCampaigns.lastDeliveryWorkerToken)
          )
        )

      await requeueSendingCampaignDeliveries(id, CANCELLED_MESSAGE, tx)

      return { workerToken: locked.lastDeliveryWorkerToken }
    },
    () => getAdminApiErrorMessage(event, 'campaignNotSending')
  )

  try {
    await removeNewsletterCampaignSendJob(id, cancelled.workerToken)
  } catch (error) {
    // The cancellation is already committed and the database is what the worker obeys — it finds
    // its token gone and stops. A queue that cannot be reached must not turn that into a 500.
    logError('newsletter.campaign.cancel.job-removal-failed', error, { campaignId: id }, event)
  }
}

/**
 * The asymmetric half of the boundary: PostgreSQL has committed, Redis may not accept the job.
 *
 * A failure here is logged and swallowed on purpose. The campaign stays `queued` holding its
 * token, which is precisely what the periodic recovery sweep looks for; rolling anything back from
 * this catch would undo a committed state on the strength of a callback that may never run.
 */
export async function enqueueNewsletterCampaignSendSafely(
  campaignId: string,
  workerToken: string | null,
  event?: H3Event
) {
  if (!workerToken) {
    return false
  }

  try {
    await enqueueNewsletterCampaignSendJob({ campaignId, workerToken })
    return true
  } catch (error) {
    logError('newsletter.campaign.enqueue-failed', error, { campaignId }, event)
    return false
  }
}
