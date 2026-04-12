import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.carouselItems.findFirst({
    where: eq(carouselItems.id, id),
    with: { translations: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  return { data: item, item }
})
