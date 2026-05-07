import { defineEventHandler, getCookie, getHeader, getRequestURL } from 'h3'
import {
  extractLocaleCodeFromPathname,
  normalizeLocaleDefinitions,
  parseAcceptLanguageHeader,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const runtimeI18n = config.public.i18n as {
    defaultLocale?: unknown
    detectBrowserLanguage?: { cookieKey?: string }
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const cookieKey = runtimeI18n.detectBrowserLanguage?.cookieKey
  const pathname = getRequestURL(event).pathname
  const isApiRequest = pathname === '/api' || pathname.startsWith('/api/')
  const headerLocale = resolveLocaleCode(
    getHeader(event, 'x-request-locale') ?? getHeader(event, 'x-locale'),
    locales,
    ''
  )
  const pathnameLocale = extractLocaleCodeFromPathname(pathname, locales)

  const cookie = cookieKey ? getCookie(event, cookieKey) : undefined
  let resolved = defaultLocale

  if (pathnameLocale) {
    resolved = pathnameLocale
  } else if (isApiRequest && headerLocale) {
    resolved = headerLocale
  } else if (cookie) {
    resolved = resolveLocaleCode(cookie, locales, defaultLocale)
  } else {
    const acceptedLocales = parseAcceptLanguageHeader(getHeader(event, 'accept-language'))

    for (const acceptedLocale of acceptedLocales) {
      const matchedLocale = resolveLocaleCode(acceptedLocale, locales, '')
      if (matchedLocale) {
        resolved = matchedLocale
        break
      }
    }
  }

  event.context.requestLocale = resolved
})
