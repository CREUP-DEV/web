import { DOMParser } from 'linkedom'

/**
 * Sanitizes uploaded SVG markup. Kept free of Nitro imports so it can be exercised directly by
 * `scripts/check-svg-sanitizer.ts`; the upload handler maps `SvgSanitizeError` to a localized
 * HTTP error.
 */

/** `invalid` means the file is not parseable SVG, `forbidden` that it carries disallowed content. */
export type SvgSanitizeFailure = 'invalid' | 'forbidden'

export class SvgSanitizeError extends Error {
  readonly reason: SvgSanitizeFailure

  constructor(reason: SvgSanitizeFailure) {
    super(`SVG rejected: ${reason}`)
    this.name = 'SvgSanitizeError'
    this.reason = reason
  }
}

// Elements permitted inside an uploaded SVG. This is an allowlist rather than a denylist because
// element names are attacker-controlled: a namespace prefix such as
// `<foo:script xmlns:foo="http://www.w3.org/1999/xhtml">` slips past any comparison against a
// fixed list of forbidden names while still being executed by browsers that render the file as a
// document. The set is DOMPurify's SVG profile trimmed to what illustrations and logos actually
// need — scripting, animation, embedding and SVG-font elements are all left out.
const allowedSvgTags = new Set([
  // Structure and metadata.
  'svg',
  'g',
  'defs',
  'symbol',
  'use',
  'switch',
  'a',
  'title',
  'desc',
  'metadata',
  'view',
  'style',
  // Shapes, text and embedded images.
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'textpath',
  'image',
  // Paint servers, clipping and masking.
  'lineargradient',
  'radialgradient',
  'stop',
  'pattern',
  'clippath',
  'mask',
  'marker',
  // Filters.
  'filter',
  'feblend',
  'fecolormatrix',
  'fecomponenttransfer',
  'fecomposite',
  'feconvolvematrix',
  'fediffuselighting',
  'fedisplacementmap',
  'fedistantlight',
  'fedropshadow',
  'feflood',
  'fefunca',
  'fefuncb',
  'fefuncg',
  'fefuncr',
  'fegaussianblur',
  'feimage',
  'femerge',
  'femergenode',
  'femorphology',
  'feoffset',
  'fepointlight',
  'fespecularlighting',
  'fespotlight',
  'fetile',
  'feturbulence',
])

const svgReferenceAttributes = new Set(['href', 'xlink:href', 'src'])

type SanitizedSvgElement = {
  tagName: string
  textContent: string | null
  getAttributeNames: () => string[]
  getAttribute: (name: string) => string | null
  removeAttribute: (name: string) => void
}

// Namespace-prefixed element names are rejected outright: no exporter emits them, and accepting
// them would mean trusting a prefix binding to decide what an element really is.
const isAllowedSvgTag = (tagName: string) =>
  !tagName.includes(':') && allowedSvgTags.has(tagName.toLowerCase())

const hasUnsafeSvgReference = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  return !normalized.startsWith('#')
}

const hasUnsafeCssReference = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return false
  }

  if (
    normalized.includes('@import') ||
    normalized.includes('expression(') ||
    normalized.includes('javascript:') ||
    normalized.includes('data:')
  ) {
    return true
  }

  let cursor = normalized.indexOf('url(')

  while (cursor !== -1) {
    const closingIndex = normalized.indexOf(')', cursor + 4)
    if (closingIndex === -1) {
      return true
    }

    const rawTarget = normalized.slice(cursor + 4, closingIndex).trim()
    const target = rawTarget.replaceAll('"', '').replaceAll("'", '')
    if (target && !target.startsWith('#')) {
      return true
    }

    cursor = normalized.indexOf('url(', closingIndex + 1)
  }

  return false
}

export function sanitizeSvgMarkup(markup: string): string {
  const source = markup.trim()

  if (!source) {
    throw new SvgSanitizeError('invalid')
  }

  let svgDocument: ReturnType<DOMParser['parseFromString']>

  try {
    svgDocument = new DOMParser().parseFromString(source, 'image/svg+xml')
  } catch {
    throw new SvgSanitizeError('invalid')
  }

  if (svgDocument.querySelector('parsererror')) {
    throw new SvgSanitizeError('invalid')
  }

  const rootElement = svgDocument.documentElement
  if (!rootElement || rootElement.tagName.toLowerCase() !== 'svg') {
    throw new SvgSanitizeError('invalid')
  }

  for (const element of Array.from(svgDocument.querySelectorAll('*')) as SanitizedSvgElement[]) {
    if (!isAllowedSvgTag(element.tagName)) {
      throw new SvgSanitizeError('forbidden')
    }

    // A <style> block reaches the same external resources as a style attribute, but its rules
    // live in text content that the per-attribute checks below never see. Rejecting rather than
    // stripping keeps the failure visible: dropping a whole stylesheet breaks the artwork.
    if (
      element.tagName.toLowerCase() === 'style' &&
      hasUnsafeCssReference(element.textContent ?? '')
    ) {
      throw new SvgSanitizeError('forbidden')
    }

    for (const attributeName of element.getAttributeNames()) {
      const normalizedAttributeName = attributeName.toLowerCase()
      const attributeValue = element.getAttribute(attributeName)?.trim() ?? ''

      if (normalizedAttributeName.startsWith('on')) {
        element.removeAttribute(attributeName)
        continue
      }

      if (
        svgReferenceAttributes.has(normalizedAttributeName) &&
        hasUnsafeSvgReference(attributeValue)
      ) {
        element.removeAttribute(attributeName)
        continue
      }

      // Any presentation attribute may carry a url() reference — stroke, stop-color and
      // flood-color as much as fill or mask — so vet every value containing one instead of
      // enumerating attribute names.
      if (
        (normalizedAttributeName === 'style' || attributeValue.toLowerCase().includes('url(')) &&
        hasUnsafeCssReference(attributeValue)
      ) {
        element.removeAttribute(attributeName)
      }
    }
  }

  const serializedSvg = rootElement.outerHTML

  if (!serializedSvg.trim()) {
    throw new SvgSanitizeError('invalid')
  }

  return serializedSvg
}
