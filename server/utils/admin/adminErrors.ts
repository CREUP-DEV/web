import { createError } from 'h3'
import type { H3Event } from 'h3'
import { logError } from '../core/logger'
import { resolveAdminApiMessage } from '../locale/adminApiErrorMessages'

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: unknown }).code === '23505'
  )
}

/**
 * True for a deletion blocked by referential integrity: 23503 (foreign-key
 * violation) or 23514 (check violation — e.g. ON DELETE SET NULL nulls a column
 * that a CHECK still requires). Lets a delete race surface as 409, not 500.
 */
export function isConstraintBlockedDeletionError(error: unknown): boolean {
  if (error === null || typeof error !== 'object' || !('code' in error)) {
    return false
  }
  const code = (error as { code: unknown }).code
  return code === '23503' || code === '23514'
}

export function throwAdminMutationError(scope: string, error: unknown, event?: H3Event): never {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error
  }

  if (isUniqueConstraintViolation(error)) {
    throw createError({
      statusCode: 409,
      message: resolveAdminApiMessage('duplicateRecord', event),
    })
  }

  logError(scope, error, undefined, event)

  throw createError({
    statusCode: 500,
    message: resolveAdminApiMessage('mutationFailed', event),
  })
}
