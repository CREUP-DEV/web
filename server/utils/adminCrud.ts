import { createError } from 'h3'
import { db } from '../db'

type AdminCrudTransaction = Parameters<typeof db.transaction>[0]
type AdminCrudTransactionContext = Parameters<AdminCrudTransaction>[0]

export async function runAdminCrudTransaction<T>(
  mutation: (tx: AdminCrudTransactionContext) => Promise<T | null | undefined>,
  errorMessage: string
): Promise<NonNullable<T>> {
  const result = await db.transaction(mutation)

  if (result == null) {
    throw createError({
      statusCode: 500,
      message: errorMessage,
    })
  }

  return result as NonNullable<T>
}
