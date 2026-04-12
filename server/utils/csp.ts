import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { getOptionalRuntimeConfigString } from './runtimeConfig'

const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'
const GOOGLE_AVATAR_ORIGIN = 'https://lh3.googleusercontent.com'

export const CSP_NONCE_CONTEXT_KEY = 'cspNonce'

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

export function createCspNonce() {
  return randomBytes(16).toString('base64')
}

export function setCspNonce(event: H3Event, nonce: string) {
  ;(event.context as Record<string, unknown>)[CSP_NONCE_CONTEXT_KEY] = nonce
}

export function getCspNonce(event: H3Event) {
  const value = (event.context as Record<string, unknown>)[CSP_NONCE_CONTEXT_KEY]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function buildContentSecurityPolicy(event: H3Event, nonce: string) {
  const runtimeConfig = useRuntimeConfig(event)
  const umamiOrigin = toOrigin(getOptionalRuntimeConfigString(runtimeConfig.umamiHost))
  const turnstileEnabled =
    getOptionalRuntimeConfigString(runtimeConfig.public?.turnstileSiteKey)?.length > 0

  const connectSrcDirectives = [
    "'self'",
    ...(umamiOrigin ? [umamiOrigin] : []),
    ...(turnstileEnabled ? [TURNSTILE_ORIGIN] : []),
  ]

  const scriptSrcDirectives = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(turnstileEnabled ? [TURNSTILE_ORIGIN] : []),
  ]

  const frameSrcDirectives = turnstileEnabled ? [TURNSTILE_ORIGIN] : ["'none'"]
  const imgSrcDirectives = ["'self'", 'data:', 'blob:', GOOGLE_AVATAR_ORIGIN]

  return [
    "default-src 'self'",
    `script-src ${scriptSrcDirectives.join(' ')}`,
    "script-src-attr 'none'",
    "style-src 'self'",
    `style-src-elem 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `img-src ${imgSrcDirectives.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connectSrcDirectives.join(' ')}`,
    `frame-src ${frameSrcDirectives.join(' ')}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export function injectNonceIntoHtmlScripts(html: string, nonce: string) {
  return html
    .replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`)
    .replace(/<style\b(?![^>]*\bnonce=)/gi, `<style nonce="${nonce}"`)
}
