import { randomBytes } from 'node:crypto'
import { getResponseHeader, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import type { NuxtRenderHTMLContext } from 'nuxt/app'
import { getOptionalRuntimeConfigString } from './runtimeConfig'

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'

const JSON_SCRIPT_TYPE_PATTERN = /\btype\s*=\s*(['"])\s*application\/(?:json|ld\+json)\s*\1/i
const NONCED_TAG_PATTERN = /\bnonce\s*=/i
const SCRIPT_SRC_PATTERN = /script-src\s+[^;]+/i
const STYLE_SRC_PATTERN = /style-src\s+[^;]+/i
const STYLE_SRC_ELEM_PATTERN = /style-src-elem\s+[^;]+/i
const STYLE_SRC_ATTR_PATTERN = /style-src-attr\s+[^;]+/i
const HTML_SECTION_KEYS = ['head', 'bodyPrepend', 'body', 'bodyAppend'] as const

function toOrigin(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function isInlineNonJsonScriptTag(input: string) {
  if (!/^<script\b/i.test(input)) {
    return false
  }

  if (/\bsrc\s*=/i.test(input) || NONCED_TAG_PATTERN.test(input)) {
    return false
  }

  return !JSON_SCRIPT_TYPE_PATTERN.test(input)
}

function injectNonceIntoTag(input: string, nonce: string, tagName: 'script' | 'style') {
  if (!new RegExp(`^<${tagName}\\b`, 'i').test(input) || NONCED_TAG_PATTERN.test(input)) {
    return input
  }

  return input.replace(new RegExp(`^<${tagName}\\b`, 'i'), `<${tagName} nonce="${nonce}"`)
}

function buildDocumentScriptSrcDirective(event: H3Event, nonce: string) {
  const runtimeConfig = useRuntimeConfig(event)
  const turnstileEnabled = Boolean(
    getOptionalRuntimeConfigString(runtimeConfig.public?.turnstileSiteKey)
  )

  const scriptSrcDirectives = [
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "'self'",
    ...(turnstileEnabled ? [TURNSTILE_ORIGIN] : []),
  ]

  return `script-src ${scriptSrcDirectives.join(' ')}`
}

export function createCspNonce() {
  return randomBytes(16).toString('base64')
}

export function applyNonceToRenderedHtml(htmlContext: NuxtRenderHTMLContext, nonce: string) {
  for (const key of HTML_SECTION_KEYS) {
    const section = htmlContext[key]
    if (!Array.isArray(section)) {
      continue
    }

    htmlContext[key] = section.map((entry) => {
      if (typeof entry !== 'string') {
        return entry
      }

      if (isInlineNonJsonScriptTag(entry)) {
        return injectNonceIntoTag(entry, nonce, 'script')
      }

      if (/^<style\b/i.test(entry)) {
        return injectNonceIntoTag(entry, nonce, 'style')
      }

      return entry
    })
  }
}

export function overrideDocumentResponseCsp(event: H3Event, nonce: string) {
  const currentHeader = getResponseHeader(event, 'Content-Security-Policy')
  const currentCsp = typeof currentHeader === 'string' ? currentHeader : null
  const scriptSrcDirective = buildDocumentScriptSrcDirective(event, nonce)
  const styleSrcDirective = "style-src 'self'"
  const styleSrcElemDirective = `style-src-elem 'self' 'nonce-${nonce}'`
  const styleSrcAttrDirective = "style-src-attr 'unsafe-inline'"

  const nextCsp = currentCsp
    ? [
        currentCsp
          .replace(SCRIPT_SRC_PATTERN, scriptSrcDirective)
          .replace(STYLE_SRC_PATTERN, styleSrcDirective),
        STYLE_SRC_ELEM_PATTERN.test(currentCsp) ? null : styleSrcElemDirective,
        STYLE_SRC_ATTR_PATTERN.test(currentCsp) ? null : styleSrcAttrDirective,
      ]
        .filter((directive): directive is string => Boolean(directive))
        .join('; ')
    : [scriptSrcDirective, styleSrcDirective, styleSrcElemDirective, styleSrcAttrDirective].join(
        '; '
      )

  setResponseHeader(event, 'Content-Security-Policy', nextCsp)
}

export function getStaticContentSecurityPolicy(options: {
  turnstileSiteKey: string
  umamiHost: string | null
}) {
  const umamiOrigin = toOrigin(options.umamiHost)
  const turnstileEnabled = options.turnstileSiteKey.trim().length > 0

  const connectSrcDirectives = [
    "'self'",
    ...(umamiOrigin ? [umamiOrigin] : []),
    ...(turnstileEnabled ? [TURNSTILE_ORIGIN] : []),
  ]
  const scriptSrcDirectives = [
    "'self'",
    "'unsafe-inline'",
    ...(turnstileEnabled ? [TURNSTILE_ORIGIN] : []),
  ]
  const frameSrcDirectives = turnstileEnabled ? [TURNSTILE_ORIGIN] : ["'none'"]

  return [
    "default-src 'self'",
    `script-src ${scriptSrcDirectives.join(' ')}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    `connect-src ${connectSrcDirectives.join(' ')}`,
    `frame-src ${frameSrcDirectives.join(' ')}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
