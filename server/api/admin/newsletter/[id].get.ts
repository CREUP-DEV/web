import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { monthKeyToDate } from '../../../utils/newsletter/newsletters'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  const normalizedItem = {
    ...item,
    isSending: Boolean(item.lastDeliveryWorkerToken),
    month: monthKeyToDate(item.monthKey),
  }

  return {
    data: normalizedItem,
  }
})
