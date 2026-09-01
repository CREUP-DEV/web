import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, asc, eq, inArray, notInArray, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '../../db'
import {
  newsletterCampaignDeliveries,
  newsletterCampaignItems,
  newsletterCampaignItemTranslations,
  newsletterCampaigns,
  newsletterCampaignTranslations,
} from '../../db/schema'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'
import { buildOptimisticLockCondition } from '../admin/optimisticLock'
import { sanitizeNewsletterIntroHtml } from '../press/pressTranslation'
import type {
  newsletterCampaignItemSchema,
  newsletterCampaignTranslationSchema,
} from '~~/shared/utils/adminSchemas'

/**
 * The transaction handle the caller is already inside. Typed as the handle rather than a structural
 * subset so passing a bare `db` is a compile error: every mutation here relies on the campaign row
 * lock its caller took, which an implicit single-statement transaction would release too early.
 */
export type NewsletterCampaignExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Read-only handle: either the pool or a transaction the caller is already inside. */
type NewsletterCampaignReader = Pick<typeof db, 'query'>

export type NewsletterCampaignTranslationInput = z.infer<typeof newsletterCampaignTranslationSchema>
export type NewsletterCampaignItemInput = z.infer<typeof newsletterCampaignItemSchema>

const DRAFT_STATUS = 'draft'

/**
 * Intro rich text is stored sanitized, never raw, against the newsletter allowlist — narrower than
 * the site's general rich text, because mail clients render a fraction of it. Returns null for
 * empty or meaningless input, so an emptied editor field clears the column.
 */
export const sanitizeCampaignIntroHtml = (value?: string | null) =>
  sanitizeNewsletterIntroHtml(value)

export function buildCampaignTranslationRows(
  campaignId: string,
  translations: NewsletterCampaignTranslationInput[]
) {
  return translations.map((translation) => ({
    campaignId,
    locale: translation.locale,
    subject: translation.subject.trim(),
    preheader: translation.preheader?.trim() || null,
    introHtml: sanitizeCampaignIntroHtml(translation.introHtml),
  }))
}

/** Full campaign for the editor: translations plus items in `position` order with their overrides. */
export async function loadNewsletterCampaign(id: string, executor: NewsletterCampaignReader = db) {
  return executor.query.newsletterCampaigns.findFirst({
    where: eq(newsletterCampaigns.id, id),
    with: {
      translations: true,
      items: {
        orderBy: [asc(newsletterCampaignItems.position), asc(newsletterCampaignItems.id)],
        with: { translations: true },
      },
    },
  })
}

export type NewsletterCampaignRecord = NonNullable<
  Awaited<ReturnType<typeof loadNewsletterCampaign>>
>

export function assertCampaignIsDraft(
  event: H3Event,
  campaign: { status: string } | null | undefined
) {
  if (!campaign) {
    throw createError({
      statusCode: 404,
      message: getAdminApiErrorMessage(event, 'campaignNotFound'),
    })
  }

  if (campaign.status !== DRAFT_STATUS) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'campaignNotDraft'),
    })
  }
}

/**
 * Take the campaign's row lock and bump its `updatedAt` in a single statement, refusing anything
 * that is no longer a draft or that another admin has already moved on.
 *
 * Child-table writes never fire the campaign's `$onUpdate`, so content mutations have to bump the
 * parent explicitly — otherwise the optimistic lock the text editor relies on would not cover them.
 * A zero-row result is re-read to tell "someone else saved first" apart from "no longer a draft".
 */
export async function lockDraftCampaignForMutation(
  tx: NewsletterCampaignExecutor,
  event: H3Event,
  id: string,
  clientUpdatedAt?: string | null
) {
  const updated = await tx
    .update(newsletterCampaigns)
    .set({ updatedAt: sql`now()` })
    .where(
      and(
        eq(newsletterCampaigns.id, id),
        eq(newsletterCampaigns.status, DRAFT_STATUS),
        clientUpdatedAt
          ? buildOptimisticLockCondition(newsletterCampaigns.updatedAt, clientUpdatedAt)
          : undefined
      )
    )
    .returning({ id: newsletterCampaigns.id })

  if (updated.length > 0) {
    return
  }

  const current = await tx.query.newsletterCampaigns.findFirst({
    where: eq(newsletterCampaigns.id, id),
    columns: { id: true, status: true },
  })

  assertCampaignIsDraft(event, current)

  throw createError({
    statusCode: 409,
    message: getAdminApiErrorMessage(event, 'campaignOptimisticLock'),
  })
}

function buildItemTranslationRows(campaignItemId: string, item: NewsletterCampaignItemInput) {
  return item.translations
    .map((translation) => ({
      campaignItemId,
      locale: translation.locale,
      titleOverride: translation.titleOverride?.trim() || null,
      excerptOverride: translation.excerptOverride?.trim() || null,
    }))
    .filter((row) => row.titleOverride !== null || row.excerptOverride !== null)
}

/**
 * Replace the campaign's item list wholesale. `position` comes from the array order, so the caller
 * can never leave a gap or a duplicate.
 *
 * Upsert first, delete afterwards: `onConflictDoUpdate` returns the conflicting rows too, so the
 * returned ids are the complete surviving set. `onConflictDoNothing` would omit pre-existing items
 * and the delete below would take them with it. Only `position` is overwritten — `snapshot` and
 * `clickCount` belong to the send, not to the editor.
 */
export async function replaceNewsletterCampaignItems(
  tx: NewsletterCampaignExecutor,
  campaignId: string,
  items: NewsletterCampaignItemInput[]
) {
  if (items.length === 0) {
    await tx
      .delete(newsletterCampaignItems)
      .where(eq(newsletterCampaignItems.campaignId, campaignId))
    return
  }

  const upserted = await tx
    .insert(newsletterCampaignItems)
    .values(
      items.map((item, index) => ({
        campaignId,
        position: index,
        itemType: item.itemType,
        itemId: item.itemId,
      }))
    )
    .onConflictDoUpdate({
      target: [
        newsletterCampaignItems.campaignId,
        newsletterCampaignItems.itemType,
        newsletterCampaignItems.itemId,
      ],
      set: { position: sql`excluded.position`, updatedAt: sql`now()` },
    })
    .returning({
      id: newsletterCampaignItems.id,
      itemType: newsletterCampaignItems.itemType,
      itemId: newsletterCampaignItems.itemId,
    })

  const keptIds = upserted.map((row) => row.id)

  await tx
    .delete(newsletterCampaignItems)
    .where(
      and(
        eq(newsletterCampaignItems.campaignId, campaignId),
        notInArray(newsletterCampaignItems.id, keptIds)
      )
    )

  const idByKey = new Map(upserted.map((row) => [`${row.itemType}:${row.itemId}`, row.id]))
  const translationRows = items.flatMap((item) => {
    const campaignItemId = idByKey.get(`${item.itemType}:${item.itemId}`)
    return campaignItemId ? buildItemTranslationRows(campaignItemId, item) : []
  })

  // Overrides carry no state worth preserving across a save, so they are rewritten rather than
  // diffed. Rows of items dropped above are already gone by cascade.
  await tx
    .delete(newsletterCampaignItemTranslations)
    .where(inArray(newsletterCampaignItemTranslations.campaignItemId, keptIds))

  if (translationRows.length > 0) {
    await tx.insert(newsletterCampaignItemTranslations).values(translationRows)
  }
}

export async function replaceNewsletterCampaignTranslations(
  tx: NewsletterCampaignExecutor,
  campaignId: string,
  translations: NewsletterCampaignTranslationInput[]
) {
  const rows = buildCampaignTranslationRows(campaignId, translations)
  const locales = rows.map((row) => row.locale)

  if (locales.length === 0) {
    await tx
      .delete(newsletterCampaignTranslations)
      .where(eq(newsletterCampaignTranslations.campaignId, campaignId))
    return
  }

  await tx
    .delete(newsletterCampaignTranslations)
    .where(
      and(
        eq(newsletterCampaignTranslations.campaignId, campaignId),
        notInArray(newsletterCampaignTranslations.locale, locales)
      )
    )

  await tx
    .insert(newsletterCampaignTranslations)
    .values(rows)
    .onConflictDoUpdate({
      target: [newsletterCampaignTranslations.locale, newsletterCampaignTranslations.campaignId],
      set: {
        subject: sql`excluded.subject`,
        preheader: sql`excluded.preheader`,
        introHtml: sql`excluded.intro_html`,
        updatedAt: sql`now()`,
      },
    })
}

/**
 * Cut-off for "add everything taken on since the last send": the most recent
 * `last_delivery_started_at` among campaigns that actually delivered something.
 *
 * Not `max(sent_at)` — a campaign left in `failed` still reached almost everyone, and skipping it
 * would re-offer content already mailed. Not "the last one attempted" either — a campaign paused
 * before its first message, or killed by SMTP before delivering anything, reached nobody and must
 * not hide that content. `null` means no campaign has ever delivered, so nothing is filtered out.
 */
export async function getLastDeliveredCampaignCutoff(): Promise<Date | null> {
  const [row] = await db
    .select({
      cutoff: sql<Date | null>`max(${newsletterCampaigns.lastDeliveryStartedAt})`,
    })
    .from(newsletterCampaigns)
    .where(sql`coalesce(${newsletterCampaigns.lastDeliverySentCount}, 0) > 0`)

  return row?.cutoff ?? null
}

/**
 * The campaign as the editor reads it: the record, its content and the delivery counters. Every
 * endpoint that changes the send state answers with this, so the client can reseat its optimistic
 * lock without a second request.
 */
export async function buildNewsletterCampaignDetail(id: string) {
  const campaign = await loadNewsletterCampaign(id)

  if (!campaign) {
    return null
  }

  const delivery = await getCampaignDeliveryStats(id)

  return {
    ...campaign,
    isSending: Boolean(campaign.lastDeliveryWorkerToken),
    stats: {
      itemCount: campaign.items.length,
      totalClicks: campaign.items.reduce((total, item) => total + item.clickCount, 0),
      unsubscribeCount: campaign.unsubscribeCount,
      delivery,
    },
  }
}

export interface NewsletterCampaignDeliveryStats {
  total: number
  queued: number
  sending: number
  sent: number
  failed: number
}

const EMPTY_DELIVERY_STATS: NewsletterCampaignDeliveryStats = {
  total: 0,
  queued: 0,
  sending: 0,
  sent: 0,
  failed: 0,
}

export async function getCampaignDeliveryStats(
  campaignId: string
): Promise<NewsletterCampaignDeliveryStats> {
  const rows = await db
    .select({
      status: newsletterCampaignDeliveries.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(newsletterCampaignDeliveries)
    .where(eq(newsletterCampaignDeliveries.campaignId, campaignId))
    .groupBy(newsletterCampaignDeliveries.status)

  return rows.reduce<NewsletterCampaignDeliveryStats>(
    (stats, row) => {
      if (row.status in stats) {
        stats[row.status as keyof NewsletterCampaignDeliveryStats] = row.count
      }
      stats.total += row.count
      return stats
    },
    { ...EMPTY_DELIVERY_STATS }
  )
}
