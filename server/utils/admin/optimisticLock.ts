import { createError } from 'h3'
import { and, eq, isNull, sql, type SQLWrapper } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import type { db } from '../../db'
import { ADMIN_OPTIMISTIC_LOCK_MESSAGE } from '~~/shared/constants/adminMessages'

export function getOptimisticLockTimestampMs(value: string | Date | null | undefined) {
  if (!value) {
    return 0
  }

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function assertOptimisticLock(
  clientUpdatedAt: string | null | undefined,
  serverUpdatedAt: string | Date | null | undefined,
  message: string = ADMIN_OPTIMISTIC_LOCK_MESSAGE
) {
  if (!clientUpdatedAt) {
    return
  }

  if (
    getOptimisticLockTimestampMs(clientUpdatedAt) !== getOptimisticLockTimestampMs(serverUpdatedAt)
  ) {
    throw createError({
      statusCode: 409,
      message,
    })
  }
}

/** Matches the row only while its `updatedAt` is still `expectedUpdatedAt`, to the millisecond. */
export function buildOptimisticLockCondition(
  updatedAtColumn: SQLWrapper,
  expectedUpdatedAt: string | Date | null | undefined
) {
  return sql`floor(extract(epoch from ${updatedAtColumn}) * 1000) = ${getOptimisticLockTimestampMs(expectedUpdatedAt)}`
}

/**
 * Optimistic-lock condition for a write whose client may not have sent `updatedAt`: the client's
 * version when it did, otherwise the one the server read before writing, so the write still cannot
 * land on a row someone else changed in between. (An `eq` against the loaded Date would never
 * match: the column keeps microseconds, the Date only milliseconds.)
 */
export function buildExpectedVersionCondition(
  updatedAtColumn: SQLWrapper,
  clientUpdatedAt: string | null | undefined,
  loadedUpdatedAt: string | Date | null | undefined
) {
  const expectedUpdatedAt = clientUpdatedAt || loadedUpdatedAt

  return expectedUpdatedAt
    ? buildOptimisticLockCondition(updatedAtColumn, expectedUpdatedAt)
    : isNull(updatedAtColumn)
}

interface DeleteWithOptimisticLockOptions<TTable extends PgTable> {
  table: TTable
  idColumn: PgColumn
  updatedAtColumn: PgColumn
  id: string
  /** The `updatedAt` the client last read. Without it the delete is unconditional. */
  clientUpdatedAt?: string | null
  messages: { notFound: string; optimisticLock: string }
}

/**
 * Deletes one row and returns it, so the caller can clean up the files it referenced. When the
 * client sent the `updatedAt` it last read, the DELETE only matches an unchanged row; on a miss the
 * row is looked up again to answer 404 (gone) or 409 (changed since the client read it).
 */
export async function deleteWithOptimisticLock<TTable extends PgTable>(
  executor: Pick<typeof db, 'delete' | 'select'>,
  options: DeleteWithOptimisticLockOptions<TTable>
): Promise<TTable['$inferSelect']> {
  const { table, idColumn, updatedAtColumn, id, clientUpdatedAt, messages } = options
  const condition = clientUpdatedAt
    ? and(eq(idColumn, id), buildOptimisticLockCondition(updatedAtColumn, clientUpdatedAt))
    : eq(idColumn, id)

  const [deleted] = await executor.delete(table).where(condition).returning()
  if (deleted) {
    return deleted as TTable['$inferSelect']
  }

  const [current] = await executor
    .select({ id: idColumn })
    .from(table as PgTable)
    .where(eq(idColumn, id))

  throw createError(
    current
      ? { statusCode: 409, message: messages.optimisticLock }
      : { statusCode: 404, message: messages.notFound }
  )
}
