import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks } from '../../../db/schema'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.featuredLinks.findFirst({
    where: eq(featuredLinks.id, id),
    with: { translations: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  return { item }
})
