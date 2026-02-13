import { defineEventHandler, getQuery } from 'h3'
import { eq, desc, and, inArray, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { newsItems, tags, newsTags } from '../db/schema'

export default defineEventHandler(async (event) => {
  const locale: string = event.context.requestLocale || 'es'
  const query = getQuery(event)
  const tagSlug = query.tag as string | undefined
  const limit = parseInt(query.limit as string) || 4

  // Build where clause
  let whereClause: SQL = eq(newsItems.active, true)

  // If tag is provided and not 'all', filter by tag
  if (tagSlug && tagSlug !== 'all') {
    const tag = await db.query.tags.findFirst({
      where: eq(tags.slug, tagSlug),
    })
    if (tag) {
      // Find all news items with this tag using the junction table
      const newsItemIds = (
        await db.query.newsTags.findMany({
          where: eq(newsTags.tagId, tag.id),
        })
      ).map((nt) => nt.newsItemId)

      if (newsItemIds.length > 0) {
        const filteredWhereClause = and(
          eq(newsItems.active, true),
          inArray(newsItems.id, newsItemIds)
        )
        whereClause = filteredWhereClause ?? eq(newsItems.active, true)
      } else {
        // No news items with this tag
        return { news: [] }
      }
    } else {
      // Tag not found
      return { news: [] }
    }
  }

  const newsItemsList = await db.query.newsItems.findMany({
    where: whereClause,
    orderBy: desc(newsItems.publishedAt),
    limit: limit,
    with: {
      translations: true,
      tags: {
        with: {
          tag: {
            with: { translations: true },
          },
        },
      },
    },
  })

  const payload = {
    news: newsItemsList.map((item) => {
      const trans = item.translations.find((t) => t.locale === locale) || item.translations[0]
      // Get first tag (for backward compatibility)
      const firstTag = item.tags[0]?.tag
      const tagTrans =
        firstTag?.translations.find((t) => t.locale === locale) || firstTag?.translations[0]
      return {
        id: item.id,
        image: item.image,
        to: item.to,
        title: trans?.title ?? '',
        tagSlug: firstTag?.slug ?? null,
        tagName: tagTrans?.name ?? null,
        publishedAt: item.publishedAt.toISOString(),
      }
    }),
  }

  return payload
})
