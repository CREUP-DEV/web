import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'
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
