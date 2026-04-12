import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { monthKeyToDate } from '../../../utils/newsletters'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })

  if (!item) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  const normalizedItem = {
    ...item,
    isSending: Boolean(item.lastDeliveryWorkerToken),
    month: monthKeyToDate(item.monthKey),
  }

  return {
    data: normalizedItem,
    item: normalizedItem,
  }
})
