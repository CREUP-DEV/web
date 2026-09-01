import { z } from 'zod'
import { defineEventHandler, getQuery, sendRedirect, setHeader } from 'h3'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../../../db'
import { newsletterCampaignItems } from '../../../../db/schema'
import { buildLocalizedPathFromLocale, SUPPORTED_LOCALE_CODES } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../../../../utils/locale/requestLocale'
import { enforceRateLimit } from '../../../../utils/public/rateLimit'
import { getPublicApiErrorMessage } from '../../../../utils/locale/apiErrorMessages'
import { logError } from '../../../../utils/core/logger'

/**
 * Click tracking for newsletter campaign links. Counts the click, then redirects to the target
 * frozen in the item's snapshot.
 *
 * Never cached: it is a GET that mutates. And never redirects anywhere the request asked for — the
 * destination comes from the snapshot, so a crafted query cannot turn this into an open redirect.
 */

const clickParamsSchema = z.object({
  campaignId: z.string().min(1).max(64),
  itemId: z.string().min(1).max(64),
})

const localeQuerySchema = z.string().trim().toLowerCase().pipe(z.enum(SUPPORTED_LOCALE_CODES))

/**
 * Excluded from the global IP rate limiter, because a send produces hundreds of legitimate clicks
 * at once from different addresses. Keying on IP *and* item instead lets a corporate scanner walk
 * every piece in one email without spending a shared quota, while still stopping repeated hits on
 * a single row — each of which is an UPDATE with its WAL and row lock.
 */
const CLICK_RATE_LIMIT = { maxRequests: 30, windowMs: 15 * 60 * 1000 }

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const { locales, defaultLocale } = getRequestLocaleContext(event)
  const params = clickParamsSchema.safeParse(event.context.params ?? {})

  // A bad link lives in emails that can no longer be corrected, so every failure path lands the
  // reader on the home page rather than on an error.
  const fallbackPath = buildLocalizedPathFromLocale('/', defaultLocale, locales, defaultLocale)

  if (!params.success) {
    return sendRedirect(event, fallbackPath, 302)
  }

  const { campaignId, itemId } = params.data
  const parsedLocale = localeQuerySchema.safeParse(getQuery(event).l ?? defaultLocale)
  const localeCode = parsedLocale.success ? parsedLocale.data : defaultLocale

  await enforceRateLimit(event, {
    // `enforceRateLimit` keys on namespace + client IP, so folding the item id into the namespace
    // is how the key becomes per-IP-and-item. The id is validated above, before it reaches Redis.
    namespace: `newsletter-click:${itemId}`,
    errorMessage: getPublicApiErrorMessage(event, 'tooManyAttempts'),
    ...CLICK_RATE_LIMIT,
  })

  try {
    // Both conditions matter: matching on the item alone would let any campaign id count a click
    // against the wrong campaign.
    const [item] = await db
      .select({ snapshot: newsletterCampaignItems.snapshot })
      .from(newsletterCampaignItems)
      .where(
        and(
          eq(newsletterCampaignItems.id, itemId),
          eq(newsletterCampaignItems.campaignId, campaignId)
        )
      )
      .limit(1)

    const target = item?.snapshot?.locales?.[localeCode] ?? item?.snapshot?.locales?.[defaultLocale]

    if (!target?.targetPath) {
      return sendRedirect(event, fallbackPath, 302)
    }

    await db
      .update(newsletterCampaignItems)
      .set({ clickCount: sql`${newsletterCampaignItems.clickCount} + 1` })
      .where(
        and(
          eq(newsletterCampaignItems.id, itemId),
          eq(newsletterCampaignItems.campaignId, campaignId)
        )
      )

    return sendRedirect(
      event,
      buildLocalizedPathFromLocale(target.targetPath, localeCode, locales, defaultLocale),
      302
    )
  } catch (error) {
    logError('newsletter.click', error, { campaignId, itemId }, event)
    return sendRedirect(event, fallbackPath, 302)
  }
})
