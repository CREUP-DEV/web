import { getBaseLanguage } from '../../../shared/utils/locale'
import { sanitizeRichTextHtml } from '../press/pressTranslation'

/**
 * Activity-entry translation resolution. Mirrors the press translation resolver
 * (per-field fallback + per-field source-language tracking for WCAG 3.1.2 `lang`),
 * but over the activity fields (title / excerpt / contentHtml / imageCaption / alt).
 * Rich-text sanitisation reuses the shared press sanitizer.
 */

type ActivityTranslationLike = {
  locale: string
  title?: string | null
  excerpt?: string | null
  contentHtml?: string | null
  imageCaption?: string | null
  alt?: string | null
}

const pickTextValue = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized.length > 0 ? normalized : null
}

const resolveEntries = <T extends ActivityTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const targetLocale = getBaseLanguage(locale) || getBaseLanguage(fallbackCode)
  const fallbackLocale = getBaseLanguage(fallbackCode)
  const localized =
    translations.find((translation) => getBaseLanguage(translation.locale) === targetLocale) ?? null
  const fallback =
    translations.find((translation) => getBaseLanguage(translation.locale) === fallbackLocale) ??
    translations[0] ??
    null

  return { localized, fallback }
}

/**
 * Base language a single rendered field resolves to: the localized row's language when it
 * supplies the value, otherwise the fallback row's; `null` when neither supplies content.
 */
const resolveFieldLocale = (
  localizedValue: string | null,
  fallbackValue: string | null,
  localizedLocale: string,
  fallbackLocale: string
): string | null => {
  if (localizedValue !== null) {
    return localizedLocale || null
  }
  if (fallbackValue !== null) {
    return fallbackLocale || null
  }
  return null
}

export const sanitizeActivityTranslation = <T extends ActivityTranslationLike>(
  translation: T
): T => ({
  ...translation,
  contentHtml: sanitizeRichTextHtml(translation.contentHtml),
})

export const sanitizeActivityTranslations = <T extends ActivityTranslationLike>(
  translations: T[]
) => translations.map((translation) => sanitizeActivityTranslation(translation))

export const resolveActivityTranslationSummary = <T extends ActivityTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolveEntries(translations, locale, fallbackCode)
  const localizedLocale = getBaseLanguage(localized?.locale)
  const fallbackLocale = getBaseLanguage(fallback?.locale)

  const title = pickTextValue(localized?.title)
  const titleFallback = pickTextValue(fallback?.title)
  const excerpt = pickTextValue(localized?.excerpt)
  const excerptFallback = pickTextValue(fallback?.excerpt)
  const imageCaption = pickTextValue(localized?.imageCaption)
  const imageCaptionFallback = pickTextValue(fallback?.imageCaption)

  return {
    title: title ?? titleFallback ?? '',
    excerpt: excerpt ?? excerptFallback ?? '',
    alt: pickTextValue(localized?.alt) ?? pickTextValue(fallback?.alt) ?? '',
    imageCaption: imageCaption ?? imageCaptionFallback ?? '',
    titleLocale: resolveFieldLocale(title, titleFallback, localizedLocale, fallbackLocale),
    excerptLocale: resolveFieldLocale(excerpt, excerptFallback, localizedLocale, fallbackLocale),
    imageCaptionLocale: resolveFieldLocale(
      imageCaption,
      imageCaptionFallback,
      localizedLocale,
      fallbackLocale
    ),
  }
}

export const resolveActivityTranslation = <T extends ActivityTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolveEntries(translations, locale, fallbackCode)
  const localizedLocale = getBaseLanguage(localized?.locale)
  const fallbackLocale = getBaseLanguage(fallback?.locale)

  const contentHtml = sanitizeRichTextHtml(localized?.contentHtml)
  const contentHtmlFallback = sanitizeRichTextHtml(fallback?.contentHtml)

  return {
    ...resolveActivityTranslationSummary(translations, locale, fallbackCode),
    contentHtml: contentHtml ?? contentHtmlFallback,
    contentLocale: resolveFieldLocale(
      contentHtml,
      contentHtmlFallback,
      localizedLocale,
      fallbackLocale
    ),
  }
}

/**
 * Area-report translation resolution (content_html / image_caption / alt). Same per-field
 * fallback + source-language tracking, but the report has no title/excerpt.
 */
export const resolveAreaReportTranslation = <T extends ActivityTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolveEntries(translations, locale, fallbackCode)
  const localizedLocale = getBaseLanguage(localized?.locale)
  const fallbackLocale = getBaseLanguage(fallback?.locale)

  const contentHtml = sanitizeRichTextHtml(localized?.contentHtml)
  const contentHtmlFallback = sanitizeRichTextHtml(fallback?.contentHtml)
  const imageCaption = pickTextValue(localized?.imageCaption)
  const imageCaptionFallback = pickTextValue(fallback?.imageCaption)

  return {
    contentHtml: contentHtml ?? contentHtmlFallback,
    contentLocale: resolveFieldLocale(
      contentHtml,
      contentHtmlFallback,
      localizedLocale,
      fallbackLocale
    ),
    imageCaption: imageCaption ?? imageCaptionFallback ?? '',
    imageCaptionLocale: resolveFieldLocale(
      imageCaption,
      imageCaptionFallback,
      localizedLocale,
      fallbackLocale
    ),
    alt: pickTextValue(localized?.alt) ?? pickTextValue(fallback?.alt) ?? '',
  }
}
