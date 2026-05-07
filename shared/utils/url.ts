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

export const toRelativeSitePath = (
  value: string | null | undefined,
  siteUrl: string | null | undefined
): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  if (!isAbsoluteHttpUrl(trimmedValue) || !siteUrl) {
    return trimmedValue
  }

  try {
    const valueUrl = new URL(trimmedValue)
    const siteBaseUrl = new URL(siteUrl)

    if (valueUrl.origin !== siteBaseUrl.origin) {
      return trimmedValue
    }

    return `${valueUrl.pathname}${valueUrl.search}${valueUrl.hash}` || '/'
  } catch {
    return trimmedValue
  }
}

interface ParsedRelativeUrl {
  hash: string
  pathname: string
  search: string
}

const parseRelativeUrl = (value: string): ParsedRelativeUrl => {
  const hashIndex = value.indexOf('#')
  const beforeHash = hashIndex === -1 ? value : value.slice(0, hashIndex)
  const hash = hashIndex === -1 ? '' : value.slice(hashIndex)
  const searchIndex = beforeHash.indexOf('?')

  return {
    pathname: searchIndex === -1 ? beforeHash : beforeHash.slice(0, searchIndex),
    search: searchIndex === -1 ? '' : beforeHash.slice(searchIndex),
    hash,
  }
}

export const getUrlPathname = (value: string): string => {
  if (isAbsoluteHttpUrl(value)) {
    try {
      return new URL(value).pathname
    } catch {
      return parseRelativeUrl(value).pathname
    }
  }

  return parseRelativeUrl(value).pathname
}

export const getUrlSearchParam = (value: string, name: string): string | null => {
  try {
    if (isAbsoluteHttpUrl(value)) {
      return new URL(value).searchParams.get(name)
    }

    return new URLSearchParams(parseRelativeUrl(value).search).get(name)
  } catch {
    return null
  }
}

export const setUrlSearchParam = (value: string, name: string, paramValue: string): string => {
  if (isAbsoluteHttpUrl(value)) {
    try {
      const parsed = new URL(value)
      parsed.searchParams.set(name, paramValue)
      return parsed.toString()
    } catch {
      return value
    }
  }

  const { pathname, search, hash } = parseRelativeUrl(value)
  const params = new URLSearchParams(search)
  params.set(name, paramValue)
  const normalizedSearch = params.toString()

  return `${pathname}${normalizedSearch ? `?${normalizedSearch}` : ''}${hash}`
}
