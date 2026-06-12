import { createError, setHeader } from 'h3'
import type { H3Event } from 'h3'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { logError } from '../core/logger'
import { isDatabaseUnavailableError } from '../core/databaseErrors'

function isHttpError(error: unknown): error is { statusCode: unknown } {
  return error !== null && typeof error === 'object' && 'statusCode' in error
}

export function throwSafePublicError(event: H3Event, scope: string, error: unknown): never {
  if (isHttpError(error)) {
    throw error
  }

  logError(scope, error, undefined, event)

  throw createError({
    statusCode: 500,
    message: getPublicApiErrorMessage(event, 'internalError'),
  })
}

/**
 * Shared catch handler for public read endpoints: a transient DB outage becomes a
 * 503 with retry-after; anything else is logged and surfaced as a safe 500. `scope`
 * is the base (e.g. 'public.tags'); '.database-unavailable' / '.unexpected-error'
 * are appended. `meta` is attached to the DB-unavailable log line.
 */
export function throwPublicDatabaseAwareError(
  event: H3Event,
  scope: string,
  error: unknown,
  meta?: Record<string, unknown>
): never {
  if (isDatabaseUnavailableError(error)) {
    logError(`${scope}.database-unavailable`, error, meta, event)
    setHeader(event, 'retry-after', 60)
    throw createError({
      statusCode: 503,
      message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
    })
  }

  throwSafePublicError(event, `${scope}.unexpected-error`, error)
}
