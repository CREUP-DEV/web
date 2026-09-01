import { createHash } from 'node:crypto'
import { defineEventHandler, getQuery, readBody, setHeader } from 'h3'
import { buildLocalizedPath } from '../utils/core/urlBuilder'
import { newsletterTokenQuerySchema, validatePublicBody } from '../utils/validation'
import { performNewsletterUnsubscribeAction } from '../utils/newsletter/newsletterSubscriptionActions'
import { enforceRateLimit } from '../utils/public/rateLimit'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'

/**
 * Two callers reach this endpoint and they need different rate limits.
 *
 * A person unsubscribing from `/desuscribirse` posts the token in the body, one request at a time
 * from their own address, so limiting by IP fits.
 *
 * RFC 8058 one-click unsubscribes are posted by the mail provider with the token in the query. Those
 * arrive from a handful of Gmail/Yahoo addresses on behalf of many different recipients, so an IP
 * limit would throttle legitimate unsubscribes. Keying on the token instead lets thousands through
 * from the same infrastructure while still stopping repetition against one subscription. The token
 * is hashed: it must never appear in a Redis key.
 */
const ONE_CLICK_RATE_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 }
const HUMAN_RATE_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 }

const readOptionalString = (source: unknown, key: string) => {
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    return undefined
  }

  const value = (source as Record<string, unknown>)[key]

  return typeof value === 'string' ? value : undefined
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  // Unsubscribe uses a one-time email token and rate limiting, so Turnstile
  // is intentionally not required here.
  const body = await readBody(event)
  const query = getQuery(event)
  const bodyToken = readOptionalString(body, 'token')
  const isOneClick = bodyToken === undefined

  const { token, c, a } = validatePublicBody(event, newsletterTokenQuerySchema, {
    token: bodyToken ?? query.token,
    c: readOptionalString(body, 'c') ?? query.c,
    a: readOptionalString(body, 'a') ?? query.a,
  })

  const errorMessage = getPublicApiErrorMessage(event, 'tooManyAttempts')

  if (isOneClick) {
    await enforceRateLimit(event, {
      namespace: `newsletter-unsubscribe-oneclick:${createHash('sha256').update(token).digest('hex')}`,
      errorMessage,
      ...ONE_CLICK_RATE_LIMIT,
    })
  } else {
    await enforceRateLimit(event, {
      namespace: 'newsletter-unsubscribe',
      errorMessage,
      ...HUMAN_RATE_LIMIT,
    })
  }

  const redirectPath = buildLocalizedPath(event, '/prensa/newsletter')
  const action = await performNewsletterUnsubscribeAction(
    token,
    c && a ? { campaignId: c, signature: a } : null
  )

  return {
    data: {
      ...action,
      redirectTo: `${redirectPath}?unsubscribed=${action.status === 'unsubscribed' ? '1' : 'invalid'}`,
    },
  }
})
