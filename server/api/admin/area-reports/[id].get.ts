import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { areaReports } from '../../../db/schema'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { sanitizeRichTextHtml } from '../../../utils/press/pressTranslation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.areaReports.findFirst({
    where: eq(areaReports.id, id),
    with: { translations: true, edition: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  return {
    data: {
      ...item,
      translations: item.translations.map((translation) => ({
        ...translation,
        contentHtml: sanitizeRichTextHtml(translation.contentHtml),
      })),
    },
  }
})
