import { getHeader, type H3Event } from 'h3'
import { getRequestLocaleContext } from '../locale/requestLocale'

// NOTE: IP extraction trusts x-forwarded-for set by the reverse proxy (NGINX).
// The application MUST run behind a trusted proxy that sets this header.

/**
 * Normalizes a base URL by stripping trailing slashes.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

/**
 * Builds an absolute URL from a base URL and a path.
 * If the path is already an absolute URL, it is returned as-is.
 */
export function buildAbsoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`
}

/**
 * Extracts the client IP from the request, using x-forwarded-for or x-real-ip headers.
 * Handles IPv6 bracket stripping and port removal for consistent results.
 */
function normalizeIpAddress(value: string | null | undefined) {
  const normalized = String(value ?? '').trim()

  if (!normalized || normalized === 'unknown') {
    return null
  }

  if (normalized.startsWith('[')) {
    return normalized
      .replace(/^\[([^\]]+)\](?::\d+)?$/, '$1')
      .toLowerCase()
      .slice(0, 128)
  }

  const withoutPort = /^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(normalized)
    ? normalized.replace(/:\d+$/, '')
    : normalized

  return withoutPort.toLowerCase().slice(0, 128) || null
}

export function getClientIp(event: H3Event): string | null {
  const forwardedIp = getHeader(event, 'x-forwarded-for')
    ?.split(',')
    .map((entry) => normalizeIpAddress(entry))
    .find(Boolean)
  const realIp = normalizeIpAddress(getHeader(event, 'x-real-ip'))
  const remoteAddress = normalizeIpAddress(event.node?.req.socket?.remoteAddress)

  return forwardedIp || realIp || remoteAddress
}

/**
 * Extracts and truncates the User-Agent header from the request.
 */
export function getUserAgent(event: H3Event): string | null {
  const userAgent = getHeader(event, 'user-agent')?.trim()

  if (!userAgent) {
    return null
  }

  return userAgent.slice(0, 512)
}

export function buildLocalizedPath(event: H3Event, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const { locale, defaultLocale } = getRequestLocaleContext(event)

  if (locale === defaultLocale) {
    return normalizedPath
  }

  return `/${locale}${normalizedPath}`
}
