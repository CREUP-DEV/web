import type { LocaleDefinition } from '~~/shared/utils/locale'
import { pickLocalizedEntry } from '~~/shared/utils/locale'

export interface TranslationLike {
  locale: string
  [key: string]: string | null
}

type ParsedTranslation<K extends string> = { locale: string } & Record<K, string | null>

export const isDefined = <T>(value: T | null): value is T => value !== null
export const toNumber = (value: unknown) => Number(value ?? 0)
export const toStringOrNull = (value: unknown) => (typeof value === 'string' ? value : null)
export const toBooleanOrNull = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (value == null) {
    return null
  }

  const normalized = String(value).trim().toLowerCase()
  if (normalized === 'true') {
    return true
  }
  if (normalized === 'false') {
    return false
  }

  return null
}
export const toDateOrNull = (value: unknown) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

const parseJsonArray = (value: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === 'object' && entry !== null && !Array.isArray(entry)
    )
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === 'object' && entry !== null && !Array.isArray(entry)
      )
    } catch {
      return []
    }
  }

  return []
}

export const parseTranslations = <K extends string>(
  value: unknown,
  key: K
): ParsedTranslation<K>[] =>
  parseJsonArray(value)
    .map((entry) => {
      const locale = toStringOrNull(entry.locale)
      if (!locale) {
        return null
      }

      const rawValue = entry[key]
      return {
        locale,
        [key]: typeof rawValue === 'string' ? rawValue : null,
      } as ParsedTranslation<K>
    })
    .filter((entry): entry is ParsedTranslation<K> => entry !== null)

export const getTranslatedValue = <T extends TranslationLike>(
  translations: T[] | undefined,
  key: Exclude<keyof T, 'locale'>,
  fallback: string,
  locale: string,
  locales: LocaleDefinition[],
  fallbackLocale: string
) => {
  if (!translations?.length) {
    return fallback
  }

  const normalizedKey = String(key)
  const preferredTranslation = pickLocalizedEntry(translations, locale, locales, fallbackLocale)
  const preferredValue = preferredTranslation?.[normalizedKey]

  if (typeof preferredValue === 'string' && preferredValue.trim()) {
    return preferredValue.trim()
  }

  const fallbackTranslation = translations.find((translation) => {
    const value = translation[normalizedKey]
    return typeof value === 'string' && value.trim()
  })

  if (fallbackTranslation) {
    return String(fallbackTranslation[normalizedKey]).trim()
  }

  return fallback
}

export const formatNewsletterMonth = (monthKey: string, languageTag: string) => {
  const label = new Intl.DateTimeFormat(languageTag, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`))

  return label.charAt(0).toUpperCase() + label.slice(1)
}
