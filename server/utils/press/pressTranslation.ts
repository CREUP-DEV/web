import createDOMPurify, { type WindowLike } from 'dompurify'
import { parseHTML } from 'linkedom'
import { getBaseLanguage } from '../../../shared/utils/locale'

type PressTranslationLike = {
  locale: string
  title?: string | null
  description?: string | null
  alt?: string | null
  contentHtml?: string | null
}
type RichTextElement = {
  attributes: Iterable<{ name: string }>
  firstChild: ChildNode | null
  ownerDocument: RichTextDocument
  parentNode: ParentNode | null
  replaceWith: (node: unknown) => void
  removeAttribute: (name: string) => void
  tagName: string
}
type RichTextAnchorElement = RichTextElement & {
  getAttribute: (name: string) => string | null
  setAttribute: (name: string, value: string) => void
}
type ParentNode = {
  insertBefore: (node: unknown, child: unknown) => void
  removeChild: (child: unknown) => void
}
type ChildNode = {
  firstChild?: ChildNode | null
}
type RichTextDocument = {
  body: {
    innerHTML: string
    textContent: string | null
    querySelectorAll: (selector: string) => Iterable<unknown>
  }
  createElement: (tagName: string) => {
    appendChild: (node: ChildNode) => void
  }
}

const richTextSanitizerWindow = parseHTML('<!doctype html><html><body></body></html>')
const richTextPurifier = createDOMPurify(richTextSanitizerWindow as unknown as WindowLike)

// linkedom only populates `document.body` when given a full HTML document. A bare `<body>…</body>`
// fragment parses to an empty body (textContent/innerHTML come back ''), which silently broke rich
// text sanitization. Always wrap fragments in a complete document before reading the body.
const parseRichTextDocument = (html: string) =>
  parseHTML(`<!doctype html><html><body>${html}</body></html>`) as unknown as {
    document: RichTextDocument
  }

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

/**
 * Newsletter intros run through the same sanitizer with a narrower tag allowlist: headings,
 * blockquotes and lists render inconsistently across email clients, so they are dropped (their
 * text is kept) instead of shipping markup that breaks in Outlook or Gmail.
 */
const allowedNewsletterIntroTags = ['a', 'b', 'br', 'em', 'i', 'p', 'strong']

const allowedRichTextAttributes = ['href', 'target']

export const extractPlainText = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return ''
  }

  const { document } = parseRichTextDocument(normalized)
  const textContent = document.body.textContent ?? ''

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

/**
 * Elements whose *content* is as unwelcome as the tag itself, so they are removed outright rather
 * than unwrapped. Everything else outside the allowlist keeps its text and loses its tag.
 */
const strippedRichTextTags = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'template',
  'noscript',
  'svg',
  'math',
])

/**
 * Enforces the tag and attribute allowlist directly on the parsed document.
 *
 * This is what actually sanitizes. The DOMPurify call above is a no-op in this runtime: it gates
 * `isSupported` on `document.implementation.createHTMLDocument`, which linkedom does not provide,
 * and silently returns its input unchanged. Shimming the missing pieces does not help either —
 * DOMPurify then traverses a DOM it cannot walk and returns an empty string. Until the HTML
 * backend changes, the allowlist has to be applied here.
 */
const enforceAllowedTags = (document: RichTextDocument, allowedTags: string[]) => {
  const allowed = new Set(allowedTags)

  for (const element of Array.from(document.body.querySelectorAll('*')) as RichTextElement[]) {
    const tagName = element.tagName?.toLowerCase()

    if (!tagName) {
      continue
    }

    if (strippedRichTextTags.has(tagName)) {
      element.parentNode?.removeChild(element)
      continue
    }

    if (!allowed.has(tagName)) {
      unwrapElement(element)
      continue
    }

    // Snapshot first: removing an attribute mutates the live collection being iterated.
    for (const { name } of [...element.attributes]) {
      if (!allowedRichTextAttributes.includes(name.toLowerCase())) {
        element.removeAttribute(name)
      }
    }
  }
}

/**
 * Single sanitization pipeline shared by every allowlist: the tag/attribute allowlist, then the
 * `b`/`i` normalization and anchor hardening. Only the set of allowed tags varies between callers.
 */
const sanitizeHtmlWithAllowedTags = (value: string | null | undefined, allowedTags: string[]) => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return null
  }

  const sanitizedSource = richTextPurifier.sanitize(normalized, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedRichTextAttributes,
    ALLOW_ARIA_ATTR: false,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false,
  }) as string

  const { document } = parseRichTextDocument(sanitizedSource)

  enforceAllowedTags(document, allowedTags)

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

export const sanitizeRichTextHtml = (value?: string | null) =>
  sanitizeHtmlWithAllowedTags(value, allowedRichTextTags)

export const sanitizeNewsletterIntroHtml = (value?: string | null) =>
  sanitizeHtmlWithAllowedTags(value, allowedNewsletterIntroTags)

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

/**
 * Base language a single rendered field resolves to: the localized row's
 * language when that row supplies the value, otherwise the fallback row's.
 * `null` when neither supplies content (the field is not rendered).
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

export const resolvePressTranslationSummary = <T extends PressTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolvePressTranslationEntries(translations, locale, fallbackCode)
  const localizedLocale = getBaseLanguage(localized?.locale)
  const fallbackLocale = getBaseLanguage(fallback?.locale)

  const title = pickTextValue(localized?.title)
  const titleFallback = pickTextValue(fallback?.title)
  const description = pickTextValue(localized?.description)
  const descriptionFallback = pickTextValue(fallback?.description)

  return {
    title: title ?? titleFallback ?? '',
    description: description ?? descriptionFallback ?? '',
    alt: pickTextValue(localized?.alt) ?? pickTextValue(fallback?.alt) ?? '',
    // Per-field source language. description/contentHtml are nullable, so a row
    // can serve a native title while its prose falls back to Spanish; each
    // rendered field must report the language it actually came from so the
    // client only marks genuinely-foreign text with `lang` (WCAG 3.1.2).
    titleLocale: resolveFieldLocale(title, titleFallback, localizedLocale, fallbackLocale),
    descriptionLocale: resolveFieldLocale(
      description,
      descriptionFallback,
      localizedLocale,
      fallbackLocale
    ),
  }
}

export const resolvePressTranslation = <T extends PressTranslationLike>(
  translations: T[],
  locale: string | null | undefined,
  fallbackCode: string
) => {
  const { localized, fallback } = resolvePressTranslationEntries(translations, locale, fallbackCode)
  const localizedLocale = getBaseLanguage(localized?.locale)
  const fallbackLocale = getBaseLanguage(fallback?.locale)

  const contentHtml = pickHtmlValue(localized?.contentHtml)
  const contentHtmlFallback = pickHtmlValue(fallback?.contentHtml)

  return {
    ...resolvePressTranslationSummary(translations, locale, fallbackCode),
    contentHtml: contentHtml ?? contentHtmlFallback,
    contentLocale: resolveFieldLocale(
      contentHtml,
      contentHtmlFallback,
      localizedLocale,
      fallbackLocale
    ),
  }
}
