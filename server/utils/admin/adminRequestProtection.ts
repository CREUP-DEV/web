import { randomBytes } from 'node:crypto'
import {
  createError,
  getCookie,
  getRequestHeader,
  getRequestURL,
  setCookie,
  type H3Event,
} from 'h3'
import { ADMIN_CSRF_COOKIE_NAME, ADMIN_CSRF_HEADER_NAME } from '~~/shared/constants/adminSecurity'
import { resolveAdminApiMessage } from '../locale/adminApiErrorMessages'

const UNSAFE_ADMIN_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isUnsafeAdminMethod(method: string) {
  return UNSAFE_ADMIN_METHODS.has(method.toUpperCase())
}

function createAdminCsrfToken() {
  return randomBytes(32).toString('base64url')
}

function getAdminCsrfCookieAttributes() {
  return {
    httpOnly: false,
    path: '/',
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

function isSameOriginAdminRequest(event: H3Event) {
  const requestOrigin = getRequestURL(event).origin
  const originHeader = getRequestHeader(event, 'origin')?.trim()

  if (originHeader) {
    try {
      return new URL(originHeader).origin === requestOrigin
    } catch {
      return false
    }
  }

  const fetchSite = getRequestHeader(event, 'sec-fetch-site')?.trim().toLowerCase()
  return fetchSite === 'same-origin'
}

export function assertSameOriginAdminMutationRequest(event: H3Event) {
  if (!isUnsafeAdminMethod(event.method)) {
    return
  }

  if (isSameOriginAdminRequest(event)) {
    return
  }

  throw createError({
    statusCode: 403,
    message: resolveAdminApiMessage('requestNotAllowed', event),
  })
}

export function ensureAdminCsrfCookie(event: H3Event) {
  const currentToken = getCookie(event, ADMIN_CSRF_COOKIE_NAME)?.trim()

  if (currentToken) {
    return currentToken
  }

  const nextToken = createAdminCsrfToken()
  setCookie(event, ADMIN_CSRF_COOKIE_NAME, nextToken, getAdminCsrfCookieAttributes())
  return nextToken
}

export function assertAdminCsrfMutationRequest(event: H3Event) {
  if (!isUnsafeAdminMethod(event.method)) {
    return
  }

  const csrfCookieToken = getCookie(event, ADMIN_CSRF_COOKIE_NAME)?.trim()
  const csrfHeaderToken = getRequestHeader(event, ADMIN_CSRF_HEADER_NAME)?.trim()

  if (csrfCookieToken && csrfHeaderToken && csrfCookieToken === csrfHeaderToken) {
    return
  }

  throw createError({
    statusCode: 403,
    message: resolveAdminApiMessage('requestNotAllowed', event),
  })
}
