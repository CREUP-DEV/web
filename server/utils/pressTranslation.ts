type PressTranslationLike = {
  locale: string
  title?: string | null
  description?: string | null
  alt?: string | null
  contentHtml?: string | null
}

const normalizeLocaleIdentifier = (value?: string | null) => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (!normalized) {
    return ''
  }

  return normalized.split('-')[0] ?? normalized
}

const stripHtml = (value?: string | null) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const pickTextValue = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized.length > 0 ? normalized : null
}

export const hasMeaningfulRichTextHtml = (value?: string | null) => stripHtml(value).length > 0

const pickHtmlValue = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return hasMeaningfulRichTextHtml(normalized) ? normalized : null
}

export const resolvePressTranslation = <T extends PressTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const targetLocale = normalizeLocaleIdentifier(locale) || normalizeLocaleIdentifier(fallbackCode)
  const fallbackLocale = normalizeLocaleIdentifier(fallbackCode)
  const localized =
    translations.find(
      (translation) => normalizeLocaleIdentifier(translation.locale) === targetLocale
    ) ?? null
  const fallback =
    translations.find(
      (translation) => normalizeLocaleIdentifier(translation.locale) === fallbackLocale
    ) ??
    translations[0] ??
    null

  return {
    title: pickTextValue(localized?.title) ?? pickTextValue(fallback?.title) ?? '',
    description:
      pickTextValue(localized?.description) ?? pickTextValue(fallback?.description) ?? '',
    alt: pickTextValue(localized?.alt) ?? pickTextValue(fallback?.alt) ?? '',
    contentHtml: pickHtmlValue(localized?.contentHtml) ?? pickHtmlValue(fallback?.contentHtml),
  }
}
