import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { activityEntries } from '../../../db/schema'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { sanitizeActivityTranslations } from '../../../utils/activity/activityTranslation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.activityEntries.findFirst({
    where: eq(activityEntries.id, id),
    with: { translations: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  return {
    data: {
      ...item,
      translations: sanitizeActivityTranslations(item.translations),
    },
  }
})
