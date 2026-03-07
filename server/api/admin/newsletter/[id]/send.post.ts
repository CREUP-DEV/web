import { createError, defineEventHandler } from 'h3'
import { requireAuth } from '../../../../utils/requireAuth'
import { monthKeyToDate, sendNewsletterById } from '../../../../utils/newsletters'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  const { item, result } = await sendNewsletterById(id)

  return {
    item: {
      ...item,
      month: monthKeyToDate(item.monthKey),
    },
    result,
  }
})
