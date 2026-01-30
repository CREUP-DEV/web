import type { defineEventHandler } from 'h3'
import { createError } from 'h3'
import { auth } from './auth'

// Middleware to protect admin routes
export async function requireAuth(
  event: Parameters<typeof defineEventHandler>[0] extends (event: infer E) => unknown ? E : never
) {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'No autorizado',
    })
  }

  return session
}
