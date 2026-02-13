/**
 * Composable for managing locales across the application
 * Centralizes locale configuration to support dynamic languages
 * Spanish (es) is the default locale and fallback
 */

export interface LocaleConfig {
  code: string
  name: string
  flag: string
}

// Available locales from i18n configuration
// Add new locales here when needed
const LOCALE_CONFIGS: LocaleConfig[] = [
  { code: 'es', name: 'Español', flag: 'i-circle-flags-es' },
  { code: 'en', name: 'Inglés', flag: 'i-circle-flags-gb' },
]

const DEFAULT_LOCALE = 'es'

export function useLocales() {
  // Get full locale configs
  const localeConfigs = computed<LocaleConfig[]>(() => LOCALE_CONFIGS)

  // Get available locale codes
  const availableLocales = computed(() => LOCALE_CONFIGS.map((l) => l.code))

  // Get a locale config by code
  const getLocaleConfig = (code: string): LocaleConfig | undefined =>
    LOCALE_CONFIGS.find((l) => l.code === code)

  // Get flag icon for a locale
  const getLocaleFlag = (code: string): string => getLocaleConfig(code)?.flag ?? 'i-tabler-world'

  // Get locale name
  const getLocaleName = (code: string): string => getLocaleConfig(code)?.name ?? code.toUpperCase()

  // Get translation with fallback to default locale (Spanish)
  const getTranslation = <T extends { locale: string }>(
    translations: T[],
    locale?: string
  ): T | undefined => {
    const targetLocale = locale ?? DEFAULT_LOCALE
    // Try to find the requested locale
    const found = translations.find((t) => t.locale === targetLocale)
    if (found) return found
    // Fallback to default locale
    return translations.find((t) => t.locale === DEFAULT_LOCALE)
  }

  // Get translation value with fallback
  const getTranslationValue = <T extends { locale: string }, K extends keyof T>(
    translations: T[],
    key: K,
    locale?: string
  ): T[K] | undefined => {
    const translation = getTranslation(translations, locale)
    return translation?.[key]
  }

  // Create empty translations array for form initialization
  const createEmptyTranslations = <T extends Record<string, unknown>>(
    template: Omit<T, 'locale'>
  ): (T & { locale: string })[] =>
    localeConfigs.value.map((config: LocaleConfig) => ({
      ...template,
      locale: config.code,
    })) as (T & { locale: string })[]

  // Map existing translations to form format, ensuring all locales exist
  const mapTranslationsToForm = <T extends { locale: string }>(
    existingTranslations: T[],
    template: Omit<T, 'locale'>
  ): T[] =>
    localeConfigs.value.map((config: LocaleConfig) => {
      const existing = existingTranslations.find((t) => t.locale === config.code)
      if (existing) return existing
      return { ...template, locale: config.code } as T
    })

  // Filter non-empty translations (those with required field filled)
  // Only Spanish is required, others are optional
  const filterNonEmptyTranslations = <T extends { locale: string }>(
    translations: T[],
    requiredField: string
  ): T[] => {
    return translations.filter((t) => {
      // Always include default locale (Spanish)
      if (t.locale === DEFAULT_LOCALE) return true
      // For other locales, only include if the required field has content
      const value = t[requiredField as keyof T]
      return typeof value === 'string' && value.trim() !== ''
    })
  }

  return {
    availableLocales,
    localeConfigs,
    defaultLocale: DEFAULT_LOCALE,
    getLocaleConfig,
    getLocaleFlag,
    getLocaleName,
    getTranslation,
    getTranslationValue,
    createEmptyTranslations,
    mapTranslationsToForm,
    filterNonEmptyTranslations,
  }
}
