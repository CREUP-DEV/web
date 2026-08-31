import type { H3Event } from 'h3'
import { getHeader, getRequestURL } from 'h3'
import {
  extractLocaleCodeFromPathname,
  normalizeLocaleDefinitions,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'

interface RuntimeI18nConfig {
  defaultLocale?: unknown
  fallbackLocale?: unknown
  locales?: unknown
}

let cachedLocalesInput: unknown
let cachedLocales = normalizeLocaleDefinitions(undefined)

function getNormalizedLocales(rawLocales: unknown) {
  if (rawLocales === cachedLocalesInput) {
    return cachedLocales
  }

  cachedLocalesInput = rawLocales
  cachedLocales = normalizeLocaleDefinitions(rawLocales)
  return cachedLocales
}

/**
 * Seeds `event.context.requestLocale`, which everything localized downstream reads.
 *
 * Called by the locale middleware and, before it can throw, by the admin guard: Nitro orders
 * middleware by filename, so the guard runs first and its security errors would otherwise be
 * emitted in the fallback locale no matter what `x-request-locale` asked for. Idempotent, so
 * whichever gets there first wins and the other is a no-op.
 */
export function seedRequestLocale(event: H3Event) {
  if (event.context.requestLocale) {
    return event.context.requestLocale as string
  }

  const runtimeI18n = useRuntimeConfig(event).public.i18n as RuntimeI18nConfig
  const locales = getNormalizedLocales(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const pathname = getRequestURL(event).pathname
  const pathnameLocale = extractLocaleCodeFromPathname(pathname, locales)

  let resolved = defaultLocale
  if (pathnameLocale) {
    resolved = pathnameLocale
  } else if (pathname === '/api' || pathname.startsWith('/api/')) {
    // Public API responses are cached in a shared cache that only varies on the x-request-locale
    // header (see setPublicRouteVaryHeaders). Resolving the API locale from the i18n cookie or
    // Accept-Language would let a single cache entry be served for several locales, so
    // x-request-locale is the only API locale source; requests without it fall back to the default.
    resolved = resolveLocaleCode(getHeader(event, 'x-request-locale'), locales, defaultLocale)
  }

  event.context.requestLocale = resolved
  return resolved
}

export function getRequestLocaleContext(event: H3Event) {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as RuntimeI18nConfig
  const locales = getNormalizedLocales(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const fallbackLocale = resolveConfiguredLocaleCode(
    runtimeI18n.fallbackLocale ?? defaultLocale,
    locales,
    defaultLocale
  )
  const pathLocale = extractLocaleCodeFromPathname(getRequestURL(event).pathname, locales)
  const locale = resolveLocaleCode(
    pathLocale ?? event.context.requestLocale,
    locales,
    fallbackLocale
  )
  const languageTag =
    locales.find((configuredLocale) => configuredLocale.code === locale)?.language ?? 'es-ES'

  return {
    locale,
    locales,
    defaultLocale,
    fallbackLocale,
    languageTag,
  }
}
