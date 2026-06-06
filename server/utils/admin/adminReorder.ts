import { createError, readBody, type H3Event } from 'h3'
import { inArray, sql, type AnyColumn } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '../../db'
import { throwAdminMutationError } from './adminErrors'
import { validateBody } from '../validation'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'
import { updateOrderSchema } from '~~/shared/utils/adminSchemas'

interface ReorderItem {
  id: string
  order: number
}

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

export function assertCompleteReorderSet(
  event: H3Event,
  items: ReorderItem[],
  existingIds: string[]
) {
  if (items.length !== existingIds.length) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'reorderMismatch'),
    })
  }

  const requestIds = items.map((item) => item.id)
  const uniqueRequestIds = new Set(requestIds)

  if (uniqueRequestIds.size !== requestIds.length) {
    throw createError({
      statusCode: 400,
      message: getAdminApiErrorMessage(event, 'reorderDuplicates'),
    })
  }

  const existingIdSet = new Set(existingIds)

  if (existingIdSet.size !== existingIds.length) {
    throw createError({
      statusCode: 500,
      message: getAdminApiErrorMessage(event, 'reorderInvalidState'),
    })
  }

  for (const requestId of uniqueRequestIds) {
    if (!existingIdSet.has(requestId)) {
      throw createError({
        statusCode: 409,
        message: getAdminApiErrorMessage(event, 'reorderMismatch'),
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
    const validated = validateBody(event, updateOrderSchema, body)
    const reorderedIds = validated.items.map((item) => item.id)
    const reorderedOrder = buildReorderOrderExpression(idColumn, orderColumn, validated.items)

    await db.transaction(async (tx) => {
      const existingItems = await tx.select({ id: idColumn }).from(table).for('update')

      assertCompleteReorderSet(
        event,
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
