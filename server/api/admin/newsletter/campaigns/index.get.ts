import { defineEventHandler } from 'h3'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../../../db'
import {
  newsletterCampaignItems,
  newsletterCampaigns,
  newsletterCampaignTranslations,
} from '../../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../../utils/validation'
import { DEFAULT_LOCALE_CODE } from '~~/shared/utils/locale'

const itemCountSql = sql<number>`(
  select count(*)
  from ${newsletterCampaignItems}
  where ${newsletterCampaignItems.campaignId} = ${newsletterCampaigns.id}
)`.mapWith(Number)

const totalClicksSql = sql<number>`(
  select coalesce(sum(${newsletterCampaignItems.clickCount}), 0)
  from ${newsletterCampaignItems}
  where ${newsletterCampaignItems.campaignId} = ${newsletterCampaigns.id}
)`.mapWith(Number)

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, paginationQuerySchema)
  const normalizedLimit = limit ?? 20
  const normalizedOffset = offset ?? 0

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: newsletterCampaigns.id,
        status: newsletterCampaigns.status,
        subject: newsletterCampaignTranslations.subject,
        sentAt: newsletterCampaigns.sentAt,
        createdAt: newsletterCampaigns.createdAt,
        updatedAt: newsletterCampaigns.updatedAt,
        lastDeliveryStartedAt: newsletterCampaigns.lastDeliveryStartedAt,
        lastDeliveryFinishedAt: newsletterCampaigns.lastDeliveryFinishedAt,
        lastDeliveryTotal: newsletterCampaigns.lastDeliveryTotal,
        lastDeliverySentCount: newsletterCampaigns.lastDeliverySentCount,
        lastDeliveryErrorCount: newsletterCampaigns.lastDeliveryErrorCount,
        unsubscribeCount: newsletterCampaigns.unsubscribeCount,
        lastDeliveryWorkerToken: newsletterCampaigns.lastDeliveryWorkerToken,
        itemCount: itemCountSql,
        totalClicks: totalClicksSql,
      })
      .from(newsletterCampaigns)
      .leftJoin(
        newsletterCampaignTranslations,
        and(
          eq(newsletterCampaignTranslations.campaignId, newsletterCampaigns.id),
          eq(newsletterCampaignTranslations.locale, DEFAULT_LOCALE_CODE)
        )
      )
      .orderBy(desc(newsletterCampaigns.createdAt), desc(newsletterCampaigns.id))
      .limit(normalizedLimit)
      .offset(normalizedOffset),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(newsletterCampaigns),
  ])

  return {
    data: items.map(({ lastDeliveryWorkerToken, ...item }) => ({
      ...item,
      isSending: Boolean(lastDeliveryWorkerToken),
    })),
    meta: { total: countResult[0]?.count ?? 0 },
  }
})
