/**
 * Composable for managing locales across the application.
 * Locale definitions are derived from the Nuxt i18n runtime config.
 */

import {
  normalizeLocaleDefinitions,
  pickLocalizedEntry,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'

export type LocaleConfig = ReturnType<typeof normalizeLocaleDefinitions>[number]

export function useLocales() {
  const runtimeConfig = useRuntimeConfig()
  const runtimeI18n = computed(
    () =>
      ((
        runtimeConfig.public as {
          i18n?: {
            defaultLocale?: unknown
            fallbackLocale?: unknown
            locales?: unknown
          }
        }
      ).i18n ?? {}) as {
        defaultLocale?: unknown
        fallbackLocale?: unknown
        locales?: unknown
      }
  )

  const localeConfigs = computed<LocaleConfig[]>(() =>
    normalizeLocaleDefinitions(runtimeI18n.value.locales)
  )

  const defaultLocaleCode = computed(() =>
    resolveConfiguredLocaleCode(runtimeI18n.value.defaultLocale, localeConfigs.value)
  )

  const fallbackLocaleCode = computed(() =>
    resolveConfiguredLocaleCode(
      runtimeI18n.value.fallbackLocale ?? defaultLocaleCode.value,
      localeConfigs.value,
      defaultLocaleCode.value
    )
  )

  const availableLocales = computed(() => localeConfigs.value.map((locale) => locale.code))

  const getLocaleConfig = (code?: string): LocaleConfig | undefined => {
    const resolvedCode = resolveLocaleCode(code, localeConfigs.value, fallbackLocaleCode.value)
    return localeConfigs.value.find((locale) => locale.code === resolvedCode)
  }

  const getLocaleFlag = (code: string): string => getLocaleConfig(code)?.flag ?? 'i-tabler-world'

  const getLocaleName = (code: string): string => getLocaleConfig(code)?.name ?? code.toUpperCase()

  const getLanguageTag = (code?: string): string =>
    getLocaleConfig(code)?.language ??
    getLocaleConfig(fallbackLocaleCode.value)?.language ??
    'es-ES'

  const getTranslation = <T extends { locale: string }>(
    translations: T[],
    locale?: string
  ): T | undefined =>
    pickLocalizedEntry(translations, locale, localeConfigs.value, fallbackLocaleCode.value)

  const getTranslationValue = <T extends { locale: string }, K extends keyof T>(
    translations: T[],
    key: K,
    locale?: string
  ): T[K] | undefined => {
    const translation = getTranslation(translations, locale)
    return translation?.[key]
  }

  const createEmptyTranslations = <T extends Record<string, unknown>>(
    template: Omit<T, 'locale'>
  ): (T & { locale: string })[] =>
    localeConfigs.value.map((config: LocaleConfig) => ({
      ...template,
      locale: config.code,
    })) as (T & { locale: string })[]

  const mapTranslationsToForm = <T extends { locale: string }>(
    existingTranslations: T[],
    template: Omit<T, 'locale'>
  ): T[] =>
    localeConfigs.value.map((config: LocaleConfig) => {
      const existing = existingTranslations.find(
        (translation) => translation.locale === config.code
      )
      if (existing) return existing
      return { ...template, locale: config.code } as T
    })

  const filterNonEmptyTranslations = <T extends { locale: string }>(
    translations: T[],
    requiredField: string
  ): T[] =>
    translations.filter((translation) => {
      if (
        resolveLocaleCode(translation.locale, localeConfigs.value, '') === defaultLocaleCode.value
      ) {
        return true
      }

      const value = translation[requiredField as keyof T]
      return typeof value === 'string' && value.trim() !== ''
    })

  return {
    availableLocales,
    localeConfigs,
    defaultLocale: defaultLocaleCode.value,
    fallbackLocale: fallbackLocaleCode.value,
    getLocaleConfig,
    getLocaleFlag,
    getLanguageTag,
    getLocaleName,
    getTranslation,
    getTranslationValue,
    createEmptyTranslations,
    mapTranslationsToForm,
    filterNonEmptyTranslations,
  }
}
