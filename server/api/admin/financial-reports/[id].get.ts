import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports } from '../../../db/schema'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.financialReports.findFirst({
    where: eq(financialReports.id, id),
    with: { translations: true },
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  const normalizedItem = {
    ...item,
    approvedAt: dateValueToDateOnly(item.approvedAt),
  }

  return {
    data: normalizedItem,
  }
})
