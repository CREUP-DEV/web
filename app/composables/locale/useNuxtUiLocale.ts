import { ca, en, es, eu, gl } from '@nuxt/ui/locale'
import { getBaseLanguage } from '~~/shared/utils/locale'

const nuxtUiLocales = { ca, en, es, eu, gl } as const

/**
 * Resolves the matching @nuxt/ui locale object for the current app locale.
 *
 * Takes the locale as an argument (rather than calling useI18n itself) so each caller keeps
 * its own i18n scope: app.vue uses the default scope, error.vue uses `{ useScope: 'global' }`.
 */
export function useNuxtUiLocale(locale: MaybeRefOrGetter<string>) {
  const { getLanguageTag } = useLocales()

  return computed(
    () =>
      nuxtUiLocales[
        getBaseLanguage(getLanguageTag(toValue(locale))) as keyof typeof nuxtUiLocales
      ] ??
      nuxtUiLocales[getBaseLanguage(getLanguageTag()) as keyof typeof nuxtUiLocales] ??
      nuxtUiLocales.es
  )
}
