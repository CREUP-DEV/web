import type { Ref } from 'vue'
import type { AdminLocaleFillStatus } from '@/components/admin/AdminLocaleTabs.vue'
import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'

const hasContent = (value: unknown) => typeof value === 'string' && value.trim().length > 0

/** Shared by the tablist and by the card it reveals, so `aria-controls` always finds its panel. */
export const localeTabId = (prefix: string, locale: string) => `${prefix}-tab-${locale}`
export const localeTabPanelId = (prefix: string, locale: string) => `${prefix}-panel-${locale}`

/**
 * Drives the admin translation tabs: which locale is on screen, how complete each translation is,
 * and which ones failed validation.
 *
 * Completeness is measured against the base locale rather than against every field, so a tab only
 * asks for what the Spanish entry actually fills in: a locale is 'complete' when it translates
 * every base field that has content, 'empty' when it translates none, 'partial' in between.
 */
export function useAdminLocaleTabs<T extends { locale: string }>(
  translations: Ref<T[]>,
  fields: Array<keyof T>,
  getFieldError: (path: string) => string | undefined
) {
  const activeLocale = ref(DEFAULT_LOCALE_CODE)
  const idPrefix = useId() ?? 'locale-tabs'

  const baseTranslation = computed(() =>
    translations.value.find((translation) => translation.locale === DEFAULT_LOCALE_CODE)
  )

  const activeIndex = computed(() =>
    translations.value.findIndex((translation) => translation.locale === activeLocale.value)
  )

  const status = computed(() => {
    const base = baseTranslation.value
    const required = base ? fields.filter((field) => hasContent(base[field])) : []
    const out: Record<string, AdminLocaleFillStatus> = {}

    for (const translation of translations.value) {
      if (translation.locale === DEFAULT_LOCALE_CODE) continue

      // A locale with nothing written in it is empty, full stop. Reporting it as complete because
      // the base has nothing to translate yet would paint a brand-new entry green in every
      // language, which reads as "already done".
      if (!fields.some((field) => hasContent(translation[field]))) {
        out[translation.locale] = 'empty'
        continue
      }

      // Something is written here but the base asks for nothing, so there is nothing outstanding.
      if (required.length === 0) {
        out[translation.locale] = 'complete'
        continue
      }

      const filled = required.filter((field) => hasContent(translation[field])).length
      out[translation.locale] = filled === required.length ? 'complete' : 'partial'
    }

    return out
  })

  const invalidLocales = computed(() =>
    translations.value
      .filter((translation, index) =>
        fields.some((field) => getFieldError(`translations.${index}.${String(field)}`))
      )
      .map((translation) => translation.locale)
  )

  // A submit that fails inside a hidden tab would otherwise leave the reader staring at a valid
  // form, so bring the first offending locale forward.
  const revealFirstInvalidLocale = () => {
    const first = invalidLocales.value[0]
    if (first) activeLocale.value = first
  }

  return {
    activeLocale,
    activeIndex,
    idPrefix,
    status,
    invalidLocales,
    revealFirstInvalidLocale,
    panelId: (locale: string) => localeTabPanelId(idPrefix, locale),
    panelLabelledBy: (locale: string) => localeTabId(idPrefix, locale),
  }
}
