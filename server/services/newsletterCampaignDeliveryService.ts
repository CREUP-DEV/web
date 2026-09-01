import pLimit from 'p-limit'
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '../db'
import { newsletterCampaignDeliveries, newsletterCampaigns } from '../db/schema'
import { logError, logInfo } from '../utils/core/logger'
import { getRequiredSiteUrl } from '../utils/core/runtimeConfig'
import { normalizeBaseUrl } from '../utils/core/urlBuilder'
import { sendNewsletterCampaignEmail } from '../utils/email/newsletterCampaignMailer'
import {
  createCampaignEmailRenderer,
  loadCampaignRenderContext,
  resolveCampaignLocaleCode,
} from '../utils/email/newsletterCampaignRender'
import { NEWSLETTER_DELIVERY_STATUS } from './newsletterDeliveryRepository'
import {
  isNewsletterCampaignDeliveryWorkerCurrent,
  markNewsletterCampaignDeliverySending,
  releaseNewsletterCampaignDeliveryWorker,
  touchNewsletterCampaignDeliveryWorker,
  type NewsletterCampaignRecord,
  type NewsletterCampaignReleaseValues,
} from './newsletterCampaignDeliveryLease'
import {
  claimNewsletterCampaignDeliveryBatch,
  deactivateCampaignSubscriberOnBounce,
  markCampaignDeliveryFailed,
  markCampaignDeliverySent,
  markInterruptedCampaignDeliveries,
  requeueSendingCampaignDeliveries,
  seedNewsletterCampaignDeliveries,
  setNewsletterCampaignDeliverySnapshot,
  type NewsletterCampaignDeliverySummary,
} from './newsletterCampaignDeliveryRepository'

/**
 * Runs a campaign send.
 *
 * The rule that shapes everything here: `sent_at` means "finished with nothing pending", and the
 * lease refuses to claim a campaign that has it. So a batch that ends leaving failed or still
 * queued deliveries finishes in `failed`, never in `sent` — that is what keeps "resend to the
 * failures" possible at all.
 */

const SMTP_CONFIG_ERROR_MESSAGE = 'Falta la configuración SMTP para enviar correos'
const CANCELLED_MESSAGE = 'Envío cancelado por administración'
const SHUTDOWN_MESSAGE = 'Envío interrumpido por apagado del servidor'
const SEND_CONCURRENCY = 5

export interface NewsletterCampaignDeliveryResult extends NewsletterCampaignDeliverySummary {
  sent: boolean
}

const activeCampaignRuns = new Map<string, string>()
let campaignShutdownRequested = false

const buildFailedRelease = (): NewsletterCampaignReleaseValues => ({
  status: 'failed',
  sentAt: null,
  lastDeliveryFinishedAt: new Date(),
  lastDeliveryHeartbeatAt: null,
})

export async function processNewsletterCampaignDeliveryRun(
  campaign: NewsletterCampaignRecord
): Promise<NewsletterCampaignDeliveryResult | false> {
  const workerToken = campaign.lastDeliveryWorkerToken ?? ''

  if (!workerToken) {
    return false
  }

  // `queued → sending` in one statement, and the guard against a job whose lease is gone: a
  // cancellation has already nulled the token, so this matches nothing and the run never starts.
  if (!(await markNewsletterCampaignDeliverySending(campaign.id, workerToken))) {
    return false
  }

  let cancelled = false
  // Every exit path releases with an explicit status: the table's biconditional CHECK rejects a
  // row whose token is null while the status still says `sending`.
  let releaseValues: NewsletterCampaignReleaseValues = buildFailedRelease()
  let result: NewsletterCampaignDeliveryResult | false = false

  activeCampaignRuns.set(campaign.id, workerToken)

  try {
    await seedNewsletterCampaignDeliveries(campaign)
    await touchNewsletterCampaignDeliveryWorker(campaign.id, workerToken)

    const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(undefined, SMTP_CONFIG_ERROR_MESSAGE))
    const context = await loadCampaignRenderContext({
      campaignId: campaign.id,
      siteUrl,
      links: 'tracked',
      unsubscribeUrl: null,
    })

    if (!context) {
      throw new Error(`Campaign ${campaign.id} disappeared before its send`)
    }

    // Execution-scoped, never per batch: a new `pLimit` is built for every batch below, and a
    // cache living inside that loop would re-render all six locales on each pass.
    const renderForLocale = createCampaignEmailRenderer(context)

    while (true) {
      if (campaignShutdownRequested) {
        break
      }

      if (!(await isNewsletterCampaignDeliveryWorkerCurrent(campaign.id, workerToken))) {
        cancelled = true
        await requeueSendingCampaignDeliveries(campaign.id, CANCELLED_MESSAGE)
        break
      }

      const batch = await claimNewsletterCampaignDeliveryBatch(campaign.id)

      if (batch.length === 0) {
        break
      }

      const limit = pLimit(SEND_CONCURRENCY)

      const tasks = batch.map(({ delivery, subscriber }) =>
        limit(async () => {
          if (!subscriber || !subscriber.active) {
            await markCampaignDeliveryFailed(
              delivery.id,
              new Error('La suscripción ya no está activa')
            )
            await touchNewsletterCampaignDeliveryWorker(campaign.id, workerToken)
            return
          }

          try {
            await sendNewsletterCampaignEmail({
              campaignId: campaign.id,
              rendered: renderForLocale(resolveCampaignLocaleCode(subscriber.locale)),
              recipient: subscriber,
              siteUrl,
              configErrorMessage: SMTP_CONFIG_ERROR_MESSAGE,
            })
            await markCampaignDeliverySent(delivery.id)
          } catch (error) {
            await markCampaignDeliveryFailed(delivery.id, error)
            logError('newsletter.campaign.send.recipient', error, {
              campaignId: campaign.id,
              deliveryId: delivery.id,
              subscriberId: subscriber.id,
            })

            try {
              await deactivateCampaignSubscriberOnBounce(subscriber.id)
            } catch (bounceError) {
              logError('newsletter.campaign.send.bounce-deactivate', bounceError, {
                campaignId: campaign.id,
                deliveryId: delivery.id,
                subscriberId: subscriber.id,
              })
            }
          } finally {
            await touchNewsletterCampaignDeliveryWorker(campaign.id, workerToken)
          }
        })
      )

      for (const settled of await Promise.allSettled(tasks)) {
        if (settled.status === 'rejected') {
          logError('newsletter.campaign.send.batch-task', settled.reason)
        }
      }
    }

    const summary = await setNewsletterCampaignDeliverySnapshot(campaign.id)
    const now = new Date()
    // Nothing failed and nothing left pending. A run cut short by a cancellation or a shutdown
    // fails this on `pendingCount`, which is exactly the intent.
    const completedSuccessfully =
      !cancelled && summary.errorCount === 0 && summary.pendingCount === 0

    releaseValues = {
      status: completedSuccessfully ? 'sent' : 'failed',
      sentAt: completedSuccessfully ? now : null,
      lastDeliveryFinishedAt: now,
      lastDeliveryHeartbeatAt: null,
    }

    logInfo('newsletter.campaign.delivery.completed', {
      campaignId: campaign.id,
      completedSuccessfully,
      errorCount: summary.errorCount,
      pendingCount: summary.pendingCount,
      sentCount: summary.sentCount,
      total: summary.total,
    })

    result = { ...summary, sent: completedSuccessfully }
  } catch (error) {
    logError('newsletter.campaign.delivery.batch', error, { campaignId: campaign.id })
    await markInterruptedCampaignDeliveries(campaign.id, error)
    await setNewsletterCampaignDeliverySnapshot(campaign.id)
    releaseValues = buildFailedRelease()
  } finally {
    try {
      // Still conditioned on the token: an admin who cancelled mid-run already nulled it, and this
      // update must not overwrite the resulting `paused`.
      await releaseNewsletterCampaignDeliveryWorker(campaign.id, workerToken, releaseValues)
    } catch (releaseError) {
      logError('newsletter.campaign.delivery.worker-release-failed', releaseError, {
        campaignId: campaign.id,
      })
    } finally {
      activeCampaignRuns.delete(campaign.id)
    }
  }

  return result
}

/**
 * Recovery sweep for the PostgreSQL/BullMQ boundary: a campaign whose job never made it into Redis
 * stays `queued` holding its token, and this picks it up and runs it in-process. Scheduled
 * periodically, not only at startup — the commit and the enqueue are not one transaction, so this
 * is part of the contract rather than a startup nicety.
 */
export async function processPendingNewsletterCampaignDeliveries() {
  const pendingCampaigns = await db.query.newsletterCampaigns.findMany({
    orderBy: [asc(newsletterCampaigns.lastDeliveryStartedAt), asc(newsletterCampaigns.id)],
    where: and(
      isNotNull(newsletterCampaigns.lastDeliveryWorkerToken),
      isNull(newsletterCampaigns.sentAt)
    ),
  })

  for (const campaign of pendingCampaigns) {
    if (campaignShutdownRequested) {
      break
    }

    await processNewsletterCampaignDeliveryRun(campaign)
  }
}

export async function processClaimedNewsletterCampaignDelivery(
  campaignId: string,
  workerToken: string
): Promise<NewsletterCampaignDeliveryResult | false> {
  const campaign = await db.query.newsletterCampaigns.findFirst({
    where: eq(newsletterCampaigns.id, campaignId),
  })

  if (!campaign || campaign.lastDeliveryWorkerToken !== workerToken) {
    return false
  }

  return processNewsletterCampaignDeliveryRun(campaign)
}

export function requestNewsletterCampaignDeliveryShutdown() {
  campaignShutdownRequested = true
}

export function getNewsletterCampaignDeliveryRuntimeState() {
  return {
    activeCampaignIds: [...activeCampaignRuns.keys()],
    activeRunCount: activeCampaignRuns.size,
    shutdownRequested: campaignShutdownRequested,
  }
}

export async function waitForNewsletterCampaignDeliveryIdle(timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now()

  while (activeCampaignRuns.size > 0) {
    if (Date.now() - startedAt >= timeoutMs) {
      return false
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return true
}

export async function requeueActiveNewsletterCampaignDeliveriesForShutdown() {
  const activeRuns = [...activeCampaignRuns.keys()]

  if (activeRuns.length === 0) {
    return
  }

  await Promise.all(
    activeRuns.map(async (campaignId) => {
      await db
        .update(newsletterCampaignDeliveries)
        .set({
          lastError: SHUTDOWN_MESSAGE,
          status: NEWSLETTER_DELIVERY_STATUS.queued,
        })
        .where(
          and(
            eq(newsletterCampaignDeliveries.campaignId, campaignId),
            eq(newsletterCampaignDeliveries.status, NEWSLETTER_DELIVERY_STATUS.sending)
          )
        )
    })
  )

  logInfo('newsletter.campaign.delivery.shutdown.requeue', { campaignIds: activeRuns })
}
