import { createError } from 'h3'
import type { H3Event } from 'h3'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { logError } from '../core/logger'

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
