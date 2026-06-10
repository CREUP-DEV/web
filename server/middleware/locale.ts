import { defineEventHandler, getHeader, getRequestURL } from 'h3'
import {
  extractLocaleCodeFromPathname,
  normalizeLocaleDefinitions,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const runtimeI18n = config.public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const pathname = getRequestURL(event).pathname
  const isApiRequest = pathname === '/api' || pathname.startsWith('/api/')
  const pathnameLocale = extractLocaleCodeFromPathname(pathname, locales)

  let resolved = defaultLocale

  if (pathnameLocale) {
    resolved = pathnameLocale
  } else if (isApiRequest) {
    // Public API responses are cached in a shared cache that only varies on the
    // x-request-locale header (see setPublicRouteVaryHeaders). Resolving the API
    // locale from the i18n cookie or Accept-Language would let a single cache entry
    // be served for several locales, so x-request-locale is the only API locale
    // source; requests without it fall back to the default locale.
    resolved = resolveLocaleCode(getHeader(event, 'x-request-locale'), locales, defaultLocale)
  }

  event.context.requestLocale = resolved
})
