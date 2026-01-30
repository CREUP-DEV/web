import { defineEventHandler } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../db'
import { tags } from '../db/schema'

export default defineEventHandler(async (event) => {
  const locale: string = event.context.requestLocale || 'es'

  const tagsList = await db.query.tags.findMany({
    orderBy: asc(tags.order),
    with: { translations: true },
  })

  const payload = {
    tags: tagsList.map((tag) => {
      const trans = tag.translations.find((t) => t.locale === locale) || tag.translations[0]
      return {
        slug: tag.slug,
        name: trans?.name ?? tag.slug,
      }
    }),
  }

  return payload
})
