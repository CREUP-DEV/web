import { createError, readBody, type H3Event } from 'h3'
import { inArray, sql, type AnyColumn } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '../../db'
import { throwAdminMutationError } from './adminErrors'
import { validateBody } from '../validation'
import { updateOrderSchema } from '~~/shared/utils/adminSchemas'

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

interface ReorderCollectionConfig {
  table: PgTable
  idColumn: PgColumn
  orderColumn: PgColumn
  invalidate: () => Promise<void> | void
  scope: string
}

/**
 * Full reorder choreography for an admin collection: validate the order payload, lock the
 * existing rows, assert the request matches the current set, apply the new order, invalidate
 * cache. Wrapped so failures return a normalized `{ message }` error via `throwAdminMutationError`
 * instead of leaking a raw 500.
 */
export async function reorderCollection(event: H3Event, config: ReorderCollectionConfig) {
  const { table, idColumn, orderColumn, invalidate, scope } = config

  try {
    const body = await readBody(event)
    const validated = validateBody(updateOrderSchema, body)
    const reorderedIds = validated.items.map((item) => item.id)
    const reorderedOrder = buildReorderOrderExpression(idColumn, orderColumn, validated.items)

    await db.transaction(async (tx) => {
      const existingItems = await tx.select({ id: idColumn }).from(table).for('update')

      assertCompleteReorderSet(
        validated.items,
        existingItems.map((item) => item.id as string)
      )

      if (validated.items.length > 0) {
        await tx
          .update(table)
          .set({ order: reorderedOrder } as never)
          .where(inArray(idColumn, reorderedIds))
      }
    })

    await invalidate()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError(scope, error, event)
  }
}
