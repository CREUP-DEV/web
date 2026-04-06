import { createError } from 'h3'
import type { H3Event } from 'h3'
import { logError } from './logger'

export function throwAdminMutationError(scope: string, error: unknown, event?: H3Event): never {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    throw error
  }

  logError(scope, error, undefined, event)

  throw createError({
    statusCode: 500,
    message: 'Error al procesar la solicitud',
  })
}
