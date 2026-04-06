const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i
const EXTERNAL_NAVIGATION_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i

export const isAbsoluteHttpUrl = (value: string | null | undefined): value is string =>
  typeof value === 'string' && ABSOLUTE_HTTP_URL_PATTERN.test(value.trim())

export const isExternalNavigationTarget = (value: string | null | undefined): boolean =>
  typeof value === 'string' && EXTERNAL_NAVIGATION_PATTERN.test(value.trim())

export const normalizeHostname = (hostname: string): string =>
  hostname.replace(/^www\./, '').toLowerCase()

export const normalizeUrl = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  if (isExternalNavigationTarget(trimmedValue)) {
    return trimmedValue
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

  if (isExternalNavigationTarget(trimmedValue)) {
    return trimmedValue
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
