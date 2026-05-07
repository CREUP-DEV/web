import { getHeader, type H3Event } from 'h3'
import { getRequestLocaleContext } from '../locale/requestLocale'

// Comma-separated list of trusted proxy CIDRs (IPv4 or IPv6).
// Only requests arriving from these IPs will have X-Forwarded-For / X-Real-IP trusted.
// Default: loopback only. In production behind NGINX set NUXT_TRUSTED_PROXY_CIDRS accordingly.
// Example: NUXT_TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128,10.0.0.0/8
const TRUSTED_PROXY_CIDRS_RAW = process.env.NUXT_TRUSTED_PROXY_CIDRS ?? '127.0.0.1/32,::1/128'

interface ParsedCidr {
  type: 'v4' | 'v6'
  network: number | bigint
  prefix: number
}

function parseIpv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    const n = parseInt(part, 10)
    if (isNaN(n) || n < 0 || n > 255) return null
    result = (result * 256 + n) | 0
  }
  return result >>> 0
}

function expandIpv6(ip: string): string | null {
  const halves = ip.split('::')
  if (halves.length > 2) return null
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - left.length - right.length
  if (missing < 0) return null
  return [...left, ...Array(missing).fill('0'), ...right].join(':')
}

function parseIpv6ToBigInt(ip: string): bigint | null {
  const expanded = expandIpv6(ip)
  if (!expanded) return null
  const groups = expanded.split(':')
  if (groups.length !== 8) return null
  try {
    return groups.reduce((acc, g) => (acc << BigInt(16)) | BigInt(parseInt(g, 16)), BigInt(0))
  } catch {
    return null
  }
}

function parseCidr(cidr: string): ParsedCidr | null {
  const slash = cidr.lastIndexOf('/')
  const ip = slash >= 0 ? cidr.slice(0, slash) : cidr
  const defaultPrefix = cidr.includes(':') ? 128 : 32
  const prefix = slash >= 0 ? parseInt(cidr.slice(slash + 1), 10) : defaultPrefix

  if (ip.includes(':')) {
    const network = parseIpv6ToBigInt(ip)
    if (network === null || isNaN(prefix) || prefix < 0 || prefix > 128) return null
    return { type: 'v6', network, prefix }
  }

  const network = parseIpv4ToInt(ip)
  if (network === null || isNaN(prefix) || prefix < 0 || prefix > 32) return null
  return { type: 'v4', network, prefix }
}

const TRUSTED_PROXY_CIDRS: ParsedCidr[] = TRUSTED_PROXY_CIDRS_RAW.split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .flatMap((cidr) => {
    const parsed = parseCidr(cidr)
    return parsed ? [parsed] : []
  })

function isIpTrusted(rawIp: string | null | undefined): boolean {
  if (!rawIp) return false
  const ip = rawIp.replace(/^::ffff:/i, '').toLowerCase()

  const ipv4Int = parseIpv4ToInt(ip)
  if (ipv4Int !== null) {
    for (const cidr of TRUSTED_PROXY_CIDRS) {
      if (cidr.type !== 'v4') continue
      const mask = cidr.prefix === 0 ? 0 : (~0 << (32 - cidr.prefix)) >>> 0
      if ((ipv4Int & mask) === ((cidr.network as number) & mask)) return true
    }
    return false
  }

  const ipv6Big = parseIpv6ToBigInt(ip)
  if (ipv6Big !== null) {
    for (const cidr of TRUSTED_PROXY_CIDRS) {
      if (cidr.type !== 'v6') continue
      if (cidr.prefix === 0) return true
      const mask = ((BigInt(1) << BigInt(cidr.prefix)) - BigInt(1)) << BigInt(128 - cidr.prefix)
      if ((ipv6Big & mask) === ((cidr.network as bigint) & mask)) return true
    }
    return false
  }

  return false
}

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
  const remoteAddress = normalizeIpAddress(event.node?.req.socket?.remoteAddress)

  if (!isIpTrusted(remoteAddress)) {
    return remoteAddress
  }

  const forwardedIp = getHeader(event, 'x-forwarded-for')
    ?.split(',')
    .map((entry) => normalizeIpAddress(entry))
    .find(Boolean)
  const realIp = normalizeIpAddress(getHeader(event, 'x-real-ip'))

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
