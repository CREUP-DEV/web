import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles } from '../../../db/schema'
import { sanitizePressTranslations } from '../../../utils/pressTranslation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.pressArticles.findFirst({
    where: eq(pressArticles.id, id),
    with: {
      translations: true,
      tags: {
        with: {
          tag: { with: { translations: true } },
        },
      },
      mediaOutlet: true,
    },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  return {
    item: {
      ...item,
      publishedAt: dateValueToDateOnly(item.publishedAt),
      translations: sanitizePressTranslations(item.translations),
    },
  }
})
