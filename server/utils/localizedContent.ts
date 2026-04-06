import { DEFAULT_LOCALE_CODE } from '~~/shared/utils/locale'

type LocalizedEntry = {
  locale: string
}

export const DEFAULT_REQUIRED_LOCALE = DEFAULT_LOCALE_CODE

export function getRequiredTranslation<T extends LocalizedEntry>(translations: T[]) {
  return translations.find((translation) => translation.locale === DEFAULT_REQUIRED_LOCALE)
}

export function getRequiredTranslationValue<T extends LocalizedEntry, K extends keyof T>(
  translations: T[],
  key: K
) {
  const value = getRequiredTranslation(translations)?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function getPreferredTranslationValue<T extends LocalizedEntry, K extends keyof T>(
  translations: T[],
  key: K
) {
  const requiredValue = getRequiredTranslationValue(translations, key)
  if (requiredValue) {
    return requiredValue
  }

  for (const translation of translations) {
    const value = translation[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

export function filterTranslationsByContent<T extends LocalizedEntry>(
  translations: T[],
  hasContent: (translation: T) => boolean
) {
  return translations.filter(
    (translation) => translation.locale === DEFAULT_REQUIRED_LOCALE || hasContent(translation)
  )
}
