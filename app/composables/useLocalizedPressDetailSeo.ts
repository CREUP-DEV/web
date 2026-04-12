import type { MaybeRef } from 'vue'
import { buildLocalizedAlternatesForLocaleCodes, getBaseLanguage } from '~~/shared/utils/locale'

interface UseLocalizedPressDetailSeoOptions {
  path: MaybeRef<string>
  translatedLocales: MaybeRef<string[] | null | undefined>
}

export function useLocalizedPressDetailSeo(options: UseLocalizedPressDetailSeoOptions) {
  const { locale } = useI18n()
  const { localeConfigs, defaultLocale, getLanguageTag } = useLocales()
  const siteConfig = useSiteConfig()

  const currentLocaleBase = computed(() => getBaseLanguage(locale.value))
  const translatedLocales = computed(() => unref(options.translatedLocales) ?? null)
  const hasNativeTranslation = computed(
    () =>
      translatedLocales.value === null ||
      translatedLocales.value.includes(currentLocaleBase.value ?? '')
  )
  const needsAlternateOverride = computed(
    () =>
      translatedLocales.value !== null &&
      localeConfigs.value.some(
        (localeConfig) => !translatedLocales.value?.includes(localeConfig.code)
      )
  )
  const baseUrl = computed(() => String(siteConfig.url ?? '').replace(/\/$/, ''))

  const alternateLinks = computed(() => {
    if (!needsAlternateOverride.value) {
      return null
    }

    return buildLocalizedAlternatesForLocaleCodes(
      unref(options.path),
      localeConfigs.value,
      defaultLocale,
      translatedLocales.value ?? [],
      {
        getHreflang: (localeConfig) => getLanguageTag(localeConfig.code),
      }
    ).map((alternate) => ({
      id: alternate.hreflang === 'x-default' ? 'i18n-xd' : `i18n-alt-${alternate.hreflang}`,
      rel: 'alternate' as const,
      hreflang: alternate.hreflang,
      href: `${baseUrl.value}${alternate.href}`,
    }))
  })

  useSeoAlternateLinksOverride(alternateLinks)

  useHead(() => {
    if (hasNativeTranslation.value) {
      return {}
    }

    return {
      meta: [{ name: 'robots', content: 'noindex,follow' }],
    }
  })
}
