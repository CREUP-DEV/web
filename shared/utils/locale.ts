import { DEFAULT_LOCALE_CODE, LOCALE_DEFINITIONS } from '../constants/locales'
export {
  DEFAULT_LOCALE_CODE,
  LOCALE_DEFINITIONS,
  SUPPORTED_LOCALE_CODES,
  type SupportedLocaleCode,
} from '../constants/locales'

export interface LocaleDefinition {
  code: string
  name: string
  language: string
  flag: string
}

interface RawLocaleDefinition {
  code?: unknown
  name?: unknown
  language?: unknown
  flag?: unknown
}

const flagFallbackByLanguage: Record<string, string> = {
  ca: 'es-ct',
  en: 'gb',
  es: 'es',
  eu: 'es-pv',
  gl: 'es-ga',
}

export const getBaseLanguage = (value?: string | null) => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (!normalized) {
    return ''
  }

  return normalized.split('-')[0] ?? normalized
}

const inferLanguageTag = (code: string) => {
  const baseLanguage = getBaseLanguage(code)
  const match = LOCALE_DEFINITIONS.find((locale) => getBaseLanguage(locale.code) === baseLanguage)

  return match?.language ?? code
}

export const inferLocaleFlag = (code: string, language?: string) => {
  const region = String(language ?? '')
    .split('-')[1]
    ?.trim()
    .toLowerCase()

  if (region) {
    return `i-circle-flags-${region}`
  }

  const baseLanguage = getBaseLanguage(language || code)
  const fallbackFlag = flagFallbackByLanguage[baseLanguage]

  if (fallbackFlag) {
    return `i-circle-flags-${fallbackFlag}`
  }

  return 'i-tabler-world'
}

const buildDefaultLocale = (): LocaleDefinition => {
  const fallback =
    LOCALE_DEFINITIONS.find((locale) => locale.code === DEFAULT_LOCALE_CODE) ??
    LOCALE_DEFINITIONS[0]

  return {
    code: fallback.code,
    name: fallback.name,
    language: fallback.language,
    flag: fallback.flag,
  }
}

export const normalizeLocaleDefinitions = (rawLocales: unknown): LocaleDefinition[] => {
  if (!Array.isArray(rawLocales)) {
    return [buildDefaultLocale()]
  }

  const locales = rawLocales
    .map((entry) => entry as RawLocaleDefinition)
    .flatMap((entry) => {
      const code = String(entry.code ?? '')
        .trim()
        .toLowerCase()

      if (!code) {
        return []
      }

      const language = String(entry.language ?? '').trim() || inferLanguageTag(code)
      const name = String(entry.name ?? '').trim() || code.toUpperCase()
      const flag = String(entry.flag ?? '').trim() || inferLocaleFlag(code, language)

      return [{ code, name, language, flag }]
    })

  if (locales.length === 0) {
    return [buildDefaultLocale()]
  }

  const uniqueLocales = new Map<string, LocaleDefinition>()
  for (const locale of locales) {
    if (!uniqueLocales.has(locale.code)) {
      uniqueLocales.set(locale.code, locale)
    }
  }

  return Array.from(uniqueLocales.values())
}

export const resolveLocaleCode = (
  input: string | null | undefined,
  locales: LocaleDefinition[],
  fallbackCode = DEFAULT_LOCALE_CODE
) => {
  const normalizedInput = String(input ?? '')
    .trim()
    .toLowerCase()

  if (!normalizedInput) {
    return fallbackCode
  }

  const exactCode = locales.find((locale) => locale.code === normalizedInput)
  if (exactCode) {
    return exactCode.code
  }

  const exactLanguage = locales.find((locale) => locale.language.toLowerCase() === normalizedInput)
  if (exactLanguage) {
    return exactLanguage.code
  }

  const baseLanguage = getBaseLanguage(normalizedInput)
  if (!baseLanguage) {
    return fallbackCode
  }

  const byCodeBase = locales.find((locale) => locale.code === baseLanguage)
  if (byCodeBase) {
    return byCodeBase.code
  }

  const byLanguageBase = locales.find((locale) => getBaseLanguage(locale.language) === baseLanguage)
  if (byLanguageBase) {
    return byLanguageBase.code
  }

  return fallbackCode
}

export const resolveConfiguredLocaleCode = (
  rawLocale: unknown,
  locales: LocaleDefinition[],
  fallbackCode = DEFAULT_LOCALE_CODE
) => {
  const preferredFallback =
    locales.find((locale) => locale.code === fallbackCode)?.code ??
    locales[0]?.code ??
    DEFAULT_LOCALE_CODE

  return resolveLocaleCode(
    typeof rawLocale === 'string' ? rawLocale : null,
    locales,
    preferredFallback
  )
}

export const parseAcceptLanguageHeader = (headerValue?: string | null) =>
  String(headerValue ?? '')
    .split(',')
    .map((entry) => {
      const [rawTag, ...params] = entry.trim().split(';')
      const tag = rawTag?.trim()
      const qualityParam = params.find((param) => param.trim().startsWith('q='))
      const qualityValue = qualityParam ? Number(qualityParam.split('=')[1]) : 1

      return {
        tag: tag ?? '',
        quality: Number.isFinite(qualityValue) ? qualityValue : 0,
      }
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag)

export const extractLocaleCodeFromPathname = (
  pathname: string | null | undefined,
  locales: LocaleDefinition[]
) => {
  const normalizedPathname = String(pathname ?? '').trim()
  if (!normalizedPathname) {
    return null
  }

  const firstSegment = normalizedPathname.split('/').filter(Boolean)[0]
  if (!firstSegment) {
    return null
  }

  return locales.find((locale) => locale.code === firstSegment.toLowerCase())?.code ?? null
}

const normalizeLocalizedPath = (path: string) => {
  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return '/'
  }

  return trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`
}

export function buildLocalizedPathFromLocale(
  path: string,
  locale: string | null | undefined,
  locales: LocaleDefinition[],
  defaultLocale: string
) {
  const normalizedPath = normalizeLocalizedPath(path)
  const normalizedDefaultLocale =
    String(defaultLocale ?? '')
      .trim()
      .toLowerCase() || DEFAULT_LOCALE_CODE
  const normalizedLocale = resolveLocaleCode(locale, locales, normalizedDefaultLocale)

  if (!normalizedLocale || normalizedLocale === normalizedDefaultLocale) {
    return normalizedPath
  }

  return `/${normalizedLocale}${normalizedPath}`
}

export function buildLocalizedAlternates(
  path: string,
  locales: LocaleDefinition[],
  defaultLocale: string
) {
  return buildLocalizedAlternatesForLocaleCodes(
    path,
    locales,
    defaultLocale,
    locales.map((locale) => locale.code)
  )
}

export function buildLocalizedAlternatesForLocaleCodes(
  path: string,
  locales: LocaleDefinition[],
  defaultLocale: string,
  translatedLocales: Iterable<string> | null | undefined,
  options: {
    getHreflang?: (locale: LocaleDefinition) => string
  } = {}
) {
  const normalizedPath = normalizeLocalizedPath(path)
  const localeCodes = new Set(
    Array.from(translatedLocales ?? []).flatMap((value) => {
      const resolvedCode = resolveLocaleCode(value, locales, '')
      return resolvedCode ? [resolvedCode] : []
    })
  )

  const alternates = locales.flatMap((locale) => {
    if (!localeCodes.has(locale.code)) {
      return []
    }

    return [
      {
        hreflang: options.getHreflang?.(locale) ?? locale.code,
        href: buildLocalizedPathFromLocale(normalizedPath, locale.code, locales, defaultLocale),
      },
    ]
  })

  const defaultHref = buildLocalizedPathFromLocale(
    normalizedPath,
    defaultLocale,
    locales,
    defaultLocale
  )

  return [...alternates, { hreflang: 'x-default', href: defaultHref }]
}

export const pickLocalizedEntry = <T extends { locale: string }>(
  entries: T[],
  locale: string | null | undefined,
  locales: LocaleDefinition[],
  fallbackCode = DEFAULT_LOCALE_CODE
) => {
  const targetLocale = resolveLocaleCode(locale, locales, fallbackCode)

  return (
    entries.find((entry) => resolveLocaleCode(entry.locale, locales, '') === targetLocale) ??
    entries.find((entry) => resolveLocaleCode(entry.locale, locales, '') === fallbackCode) ??
    entries[0]
  )
}

/**
 * Resolve the localized entry for `locale`, but fill any field it leaves empty
 * (null or blank) from the default-locale entry. Mirrors the per-field fallback
 * of resolvePressTranslationSummary so a partial non-default translation never
 * renders blank prose while the default-locale value exists.
 */
export const pickLocalizedEntryWithFieldFallback = <T extends { locale: string }>(
  entries: T[],
  locale: string | null | undefined,
  locales: LocaleDefinition[],
  fallbackCode = DEFAULT_LOCALE_CODE
): T | undefined => {
  const localized = pickLocalizedEntry(entries, locale, locales, fallbackCode)
  if (!localized) {
    return undefined
  }

  const fallback = pickLocalizedEntry(entries, fallbackCode, locales, fallbackCode)
  if (!fallback || fallback === localized) {
    return localized
  }

  const isEmpty = (value: unknown) =>
    value == null || (typeof value === 'string' && value.trim() === '')

  let merged: T | undefined
  for (const key of Object.keys(localized) as (keyof T)[]) {
    if (key === 'locale' || !isEmpty(localized[key]) || isEmpty(fallback[key])) {
      continue
    }
    merged = merged ?? { ...localized }
    merged[key] = fallback[key]
  }

  return merged ?? localized
}

export const pickLocalizedValue = <T>(
  values: Partial<Record<string, T>>,
  locale: string | null | undefined,
  fallbackLocale: string | null | undefined,
  defaultCode = DEFAULT_LOCALE_CODE
) => {
  const localeCandidates = [
    String(locale ?? '')
      .trim()
      .toLowerCase(),
    getBaseLanguage(locale),
    String(fallbackLocale ?? '')
      .trim()
      .toLowerCase(),
    getBaseLanguage(fallbackLocale),
    defaultCode,
  ].filter(Boolean)

  for (const candidate of localeCandidates) {
    if (candidate in values) {
      return values[candidate]
    }
  }

  return Object.values(values).find((value) => value !== undefined)
}
