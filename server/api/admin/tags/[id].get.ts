import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.tags.findFirst({
    where: eq(tags.id, id),
    with: { translations: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  return { data: item }
})
