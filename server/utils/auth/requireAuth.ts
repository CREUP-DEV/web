import type { H3Event } from 'h3'
import { createError } from 'h3'
import { auth } from './auth'
import { isAdminEmailAuthorized, isEnvAdminEmail, normalizeAdminEmail } from '../admin/adminAccess'

export type AdminSession = Awaited<ReturnType<typeof auth.api.getSession>>

export interface AdminAuthEventContext {
  adminSession?: AdminSession
}

export async function requireAuth(event: H3Event) {
  const context = event.context as AdminAuthEventContext

  if (context.adminSession) {
    return context.adminSession
  }

  const session = await auth.api.getSession({
    headers: event.headers,
    query: {
      disableCookieCache: true,
    },
  })

  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'No autorizado',
    })
  }

  const normalizedEmail = session.user.email ? normalizeAdminEmail(session.user.email) : ''
  if (!normalizedEmail || !(await isAdminEmailAuthorized(normalizedEmail))) {
    throw createError({
      statusCode: 403,
      message: 'Acceso no autorizado',
    })
  }

  context.adminSession = session

  return session
}

export async function requireEnvAdmin(event: H3Event) {
  const session = await requireAuth(event)
  const normalizedEmail = session.user.email ? normalizeAdminEmail(session.user.email) : ''

  if (!normalizedEmail || !isEnvAdminEmail(normalizedEmail)) {
    throw createError({
      statusCode: 403,
      message: 'Acceso reservado a administradores definidos en el entorno',
    })
  }

  return session
}
