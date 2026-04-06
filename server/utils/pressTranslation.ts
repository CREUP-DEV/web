type PressTranslationLike = {
  locale: string
  title?: string | null
  description?: string | null
  alt?: string | null
  contentHtml?: string | null
}

const blockedElementPattern =
  /<(script|style|iframe|object|embed|template|svg|math|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1\s*>/gi
const blockedSingleTagPattern =
  /<(script|style|iframe|object|embed|template|svg|math|form|input|button|textarea|select)\b[^>]*\/?>/gi
const htmlCommentPattern = /<!--[\s\S]*?-->/g
const doctypePattern = /<!doctype[^>]*>/gi
const tagPattern = /<\/?([a-z0-9]+)\b([^>]*)>/gi
const attributePattern = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi

const allowedTags = new Set([
  'a',
  'blockquote',
  'br',
  'em',
  'h2',
  'h3',
  'li',
  'ol',
  'p',
  'strong',
  'ul',
])
const voidTags = new Set(['br'])
const tagAliases: Record<string, string> = {
  b: 'strong',
  i: 'em',
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

const escapeHtmlText = (value: string) =>
  value
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]+|#\d+|#x[a-fA-F0-9]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const escapeHtmlAttribute = (value: string) =>
  escapeHtmlText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const sanitizeRichTextLinkHref = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }

  if (normalized.startsWith('/') || normalized.startsWith('#')) {
    return normalized
  }

  try {
    const parsedUrl = new URL(normalized)
    if (
      parsedUrl.protocol === 'http:' ||
      parsedUrl.protocol === 'https:' ||
      parsedUrl.protocol === 'mailto:'
    ) {
      return parsedUrl.toString()
    }
  } catch {
    return null
  }

  return null
}

export const sanitizeRichTextHtml = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }

  const sanitizedSource = normalized
    .replace(htmlCommentPattern, '')
    .replace(doctypePattern, '')
    .replace(blockedElementPattern, '')
    .replace(blockedSingleTagPattern, '')

  let sanitizedHtml = ''
  let lastIndex = 0
  const openTags: string[] = []

  for (const match of sanitizedSource.matchAll(tagPattern)) {
    const fullMatch = match[0]
    const rawTagName = match[1]?.toLowerCase() ?? ''
    const tagName = tagAliases[rawTagName] ?? rawTagName
    const matchIndex = match.index ?? 0

    sanitizedHtml += escapeHtmlText(sanitizedSource.slice(lastIndex, matchIndex))
    lastIndex = matchIndex + fullMatch.length

    if (!allowedTags.has(tagName)) {
      continue
    }

    const isClosingTag = fullMatch.startsWith('</')

    if (isClosingTag) {
      if (voidTags.has(tagName)) {
        continue
      }

      const openTagIndex = openTags.lastIndexOf(tagName)
      if (openTagIndex === -1) {
        continue
      }

      while (openTags.length > openTagIndex + 1) {
        sanitizedHtml += `</${openTags.pop()!}>`
      }

      openTags.pop()
      sanitizedHtml += `</${tagName}>`
      continue
    }

    if (voidTags.has(tagName)) {
      sanitizedHtml += '<br />'
      continue
    }

    if (tagName === 'a') {
      let href: string | null = null
      let target: string | null = null

      for (const attributeMatch of match[2]?.matchAll(attributePattern) ?? []) {
        const attributeName = attributeMatch[1]?.toLowerCase()
        const attributeValue = attributeMatch[2] ?? attributeMatch[3] ?? attributeMatch[4] ?? ''

        if (attributeName === 'href') {
          href = sanitizeRichTextLinkHref(attributeValue)
        }

        if (attributeName === 'target' && attributeValue === '_blank') {
          target = '_blank'
        }
      }

      if (!href) {
        continue
      }

      const attributes = [`href="${escapeHtmlAttribute(href)}"`]
      if (target === '_blank') {
        attributes.push('target="_blank"', 'rel="noopener noreferrer"')
      }

      sanitizedHtml += `<a ${attributes.join(' ')}>`
      openTags.push(tagName)
      continue
    }

    sanitizedHtml += `<${tagName}>`
    openTags.push(tagName)
  }

  sanitizedHtml += escapeHtmlText(sanitizedSource.slice(lastIndex))

  while (openTags.length > 0) {
    sanitizedHtml += `</${openTags.pop()!}>`
  }

  return stripHtml(sanitizedHtml).length > 0 ? sanitizedHtml : null
}

export const hasMeaningfulRichTextHtml = (value?: string | null) =>
  stripHtml(sanitizeRichTextHtml(value)).length > 0

export const sanitizePressTranslation = <T extends PressTranslationLike>(translation: T): T => ({
  ...translation,
  contentHtml: sanitizeRichTextHtml(translation.contentHtml),
})

export const sanitizePressTranslations = <T extends PressTranslationLike>(translations: T[]) =>
  translations.map((translation) => sanitizePressTranslation(translation))

const pickHtmlValue = (value?: string | null) => {
  return sanitizeRichTextHtml(value)
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
