import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments } from '../../../db/schema'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.equalityDocuments.findFirst({
    where: eq(equalityDocuments.id, id),
    with: { translations: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  return { data: item }
})
