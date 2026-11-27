import { createError } from 'h3'
import type { H3Event } from 'h3'
import { logError } from '../core/logger'
import { resolveAdminApiMessage } from '../locale/adminApiErrorMessages'

/**
 * The Postgres error code anywhere in the cause chain. drizzle-orm wraps every driver error in a
 * DrizzleQueryError that keeps the pg error (and its `code`) only on `cause`, so checking the top
 * level alone never matched a real query error and every 409 below came back as a 500.
 */
export function getPostgresErrorCode(error: unknown): string | null {
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current !== null && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const code = (current as { code?: unknown }).code
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) {
      return code
    }
    current = (current as { cause?: unknown }).cause
  }
  return null
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === '23505'
}

/** True for an exclusion-constraint violation (23P01) — e.g. an overlapping edition range. */
export function isExclusionConstraintViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === '23P01'
}

/**
 * True for a deletion blocked by referential integrity: 23503 (foreign-key
 * violation) or 23514 (check violation — e.g. ON DELETE SET NULL nulls a column
 * that a CHECK still requires). Lets a delete race surface as 409, not 500.
 */
export function isConstraintBlockedDeletionError(error: unknown): boolean {
  const code = getPostgresErrorCode(error)
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
