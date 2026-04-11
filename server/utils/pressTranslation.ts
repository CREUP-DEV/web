import createDOMPurify, { type WindowLike } from 'dompurify'
import { JSDOM } from 'jsdom'
import { getBaseLanguage } from '~~/shared/utils/locale'

type PressTranslationLike = {
  locale: string
  title?: string | null
  description?: string | null
  alt?: string | null
  contentHtml?: string | null
}
type RichTextElement = InstanceType<JSDOM['window']['Element']>
type RichTextAnchorElement = InstanceType<JSDOM['window']['HTMLAnchorElement']>

const richTextPurifier = createDOMPurify(new JSDOM('').window as unknown as WindowLike)

const allowedRichTextTags = [
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
  'b',
  'i',
]
const allowedRichTextAttributes = ['href', 'target']

const extractPlainText = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return ''
  }

  const textContent = JSDOM.fragment(normalized).textContent ?? ''

  return textContent
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const pickTextValue = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized.length > 0 ? normalized : null
}

const resolvePressTranslationEntries = <T extends PressTranslationLike>(
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
      parsedUrl.protocol === 'mailto:' ||
      parsedUrl.protocol === 'tel:'
    ) {
      return parsedUrl.toString()
    }
  } catch {
    return null
  }

  return null
}

const replaceElementTag = (element: RichTextElement, tagName: 'strong' | 'em') => {
  const ownerDocument = element.ownerDocument
  const replacement = ownerDocument.createElement(tagName)

  while (element.firstChild) {
    replacement.appendChild(element.firstChild)
  }

  element.replaceWith(replacement)
}

const unwrapElement = (element: RichTextElement) => {
  const parentNode = element.parentNode
  if (!parentNode) {
    return
  }

  while (element.firstChild) {
    parentNode.insertBefore(element.firstChild, element)
  }

  parentNode.removeChild(element)
}

export const sanitizeRichTextHtml = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }

  const sanitizedSource = richTextPurifier.sanitize(normalized, {
    ALLOWED_TAGS: allowedRichTextTags,
    ALLOWED_ATTR: allowedRichTextAttributes,
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  }) as string

  const document = new JSDOM(`<body>${sanitizedSource}</body>`).window.document

  for (const boldElement of Array.from(document.body.querySelectorAll('b')) as RichTextElement[]) {
    replaceElementTag(boldElement, 'strong')
  }

  for (const italicElement of Array.from(
    document.body.querySelectorAll('i')
  ) as RichTextElement[]) {
    replaceElementTag(italicElement, 'em')
  }

  for (const anchorElement of Array.from(
    document.body.querySelectorAll('a')
  ) as RichTextAnchorElement[]) {
    const href = sanitizeRichTextLinkHref(anchorElement.getAttribute('href'))

    if (!href) {
      unwrapElement(anchorElement)
      continue
    }

    anchorElement.setAttribute('href', href)

    if (anchorElement.getAttribute('target') === '_blank') {
      anchorElement.setAttribute('target', '_blank')
      anchorElement.setAttribute('rel', 'noopener noreferrer')
      continue
    }

    anchorElement.removeAttribute('target')
    anchorElement.removeAttribute('rel')
  }

  const sanitizedHtml = document.body.innerHTML.trim()

  return extractPlainText(sanitizedHtml).length > 0 ? sanitizedHtml : null
}

export const hasMeaningfulRichTextHtml = (value?: string | null) =>
  sanitizeRichTextHtml(value) !== null

export const sanitizePressTranslation = <T extends PressTranslationLike>(translation: T): T => ({
  ...translation,
  contentHtml: sanitizeRichTextHtml(translation.contentHtml),
})

export const sanitizePressTranslations = <T extends PressTranslationLike>(translations: T[]) =>
  translations.map((translation) => sanitizePressTranslation(translation))

const pickHtmlValue = (value?: string | null) => {
  return sanitizeRichTextHtml(value)
}

export const resolvePressTranslationSummary = <T extends PressTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolvePressTranslationEntries(translations, locale, fallbackCode)

  return {
    title: pickTextValue(localized?.title) ?? pickTextValue(fallback?.title) ?? '',
    description:
      pickTextValue(localized?.description) ?? pickTextValue(fallback?.description) ?? '',
    alt: pickTextValue(localized?.alt) ?? pickTextValue(fallback?.alt) ?? '',
  }
}

export const resolvePressTranslation = <T extends PressTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolvePressTranslationEntries(translations, locale, fallbackCode)

  return {
    ...resolvePressTranslationSummary(translations, locale, fallbackCode),
    contentHtml: pickHtmlValue(localized?.contentHtml) ?? pickHtmlValue(fallback?.contentHtml),
  }
}
