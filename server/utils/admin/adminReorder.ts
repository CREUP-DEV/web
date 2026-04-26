import { createError } from 'h3'
import { sql, type AnyColumn } from 'drizzle-orm'

interface ReorderItem {
  id: string
  order: number
}

const REORDER_ERROR_MESSAGE =
  'La lista enviada no coincide con el estado actual. Recarga la página antes de reordenar.'

export function buildReorderOrderExpression(
  idColumn: AnyColumn,
  orderColumn: AnyColumn,
  items: ReorderItem[]
): ReturnType<typeof sql<number>> {
  if (items.length === 0) {
    return sql<number>`${orderColumn}`
  }

  return sql<number>`case ${idColumn} ${sql.join(
    items.map((item) => sql`when ${item.id} then ${item.order}`),
    sql.raw(' ')
  )} else ${orderColumn} end`
}

export function assertCompleteReorderSet(items: ReorderItem[], existingIds: string[]) {
  if (items.length !== existingIds.length) {
    throw createError({
      statusCode: 409,
      message: REORDER_ERROR_MESSAGE,
    })
  }

  const requestIds = items.map((item) => item.id)
  const uniqueRequestIds = new Set(requestIds)

  if (uniqueRequestIds.size !== requestIds.length) {
    throw createError({
      statusCode: 400,
      message: 'La lista contiene elementos duplicados',
    })
  }

  const existingIdSet = new Set(existingIds)

  if (existingIdSet.size !== existingIds.length) {
    throw createError({
      statusCode: 500,
      message: 'El estado actual no es válido para reordenar',
    })
  }

  for (const requestId of uniqueRequestIds) {
    if (!existingIdSet.has(requestId)) {
      throw createError({
        statusCode: 409,
        message: REORDER_ERROR_MESSAGE,
      })
    }
  }
}
