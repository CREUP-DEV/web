const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i
const UNSAFE_URL_SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i
const BARE_HOSTNAME_PATTERN = /^[a-z0-9.-]+(?:[/?#].*)?$/i
const BARE_HOST_WITH_PORT_PATTERN = /^[a-z0-9.-]+:\d+(?:[/?#].*)?$/i

export const isAbsoluteHttpUrl = (value: string | null | undefined): value is string =>
  typeof value === 'string' && ABSOLUTE_HTTP_URL_PATTERN.test(value.trim())

export const isExternalNavigationTarget = (value: string | null | undefined): boolean =>
  typeof value === 'string' && ABSOLUTE_HTTP_URL_PATTERN.test(value.trim())

export const normalizeHostname = (hostname: string): string =>
  hostname.replace(/^www\./, '').toLowerCase()

export const isLocalDevelopmentHostname = (hostname: string): boolean => {
  const normalizedHostname = normalizeHostname(hostname).replace(/^\[(.*)\]$/, '$1')

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1'
  )
}

export const normalizeUrl = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  if (trimmedValue.startsWith('/') || trimmedValue.startsWith('#')) {
    return null
  }

  if (/\s/.test(trimmedValue)) {
    return null
  }

  if (isExternalNavigationTarget(trimmedValue)) {
    return trimmedValue
  }

  if (BARE_HOSTNAME_PATTERN.test(trimmedValue) || BARE_HOST_WITH_PORT_PATTERN.test(trimmedValue)) {
    return `https://${trimmedValue}`
  }

  if (UNSAFE_URL_SCHEME_PATTERN.test(trimmedValue)) {
    return null
  }

  return `https://${trimmedValue}`
}

export const toAbsoluteUrl = (
  value: string | null | undefined,
  siteUrl: string | null | undefined
): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue || trimmedValue.startsWith('#')) {
    return null
  }

  if (trimmedValue.startsWith('//')) {
    return null
  }

  if (/\s/.test(trimmedValue)) {
    return null
  }

  if (isExternalNavigationTarget(trimmedValue)) {
    return trimmedValue
  }

  if (BARE_HOSTNAME_PATTERN.test(trimmedValue) || BARE_HOST_WITH_PORT_PATTERN.test(trimmedValue)) {
    return `https://${trimmedValue}`
  }

  if (UNSAFE_URL_SCHEME_PATTERN.test(trimmedValue)) {
    return null
  }

  if (!siteUrl) {
    return null
  }

  try {
    return new URL(trimmedValue, siteUrl).toString()
  } catch {
    return null
  }
}
