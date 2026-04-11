import { defineEventHandler, getQuery, readBody, setHeader } from 'h3'
import { buildLocalizedPath } from '../utils/urlBuilder'
import { newsletterTokenQuerySchema, validatePublicBody } from '../utils/validation'
import { performNewsletterUnsubscribeAction } from '../utils/newsletterSubscriptionActions'
import { enforceRateLimit } from '../utils/rateLimit'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    namespace: 'newsletter-unsubscribe',
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    errorMessage: getPublicApiErrorMessage(event, 'tooManyAttempts'),
  })

  setHeader(event, 'cache-control', 'no-store')

  const body = await readBody(event)
  const query = getQuery(event)
  const bodyToken =
    typeof body === 'object' && body !== null && !Array.isArray(body) && 'token' in body
      ? body.token
      : undefined
  const { token } = validatePublicBody(event, newsletterTokenQuerySchema, {
    token: bodyToken ?? query.token,
  })
  const redirectPath = buildLocalizedPath(event, '/prensa/newsletter')
  const action = await performNewsletterUnsubscribeAction(token)
  return {
    ...action,
    redirectTo: `${redirectPath}?unsubscribed=${action.status === 'unsubscribed' ? '1' : 'invalid'}`,
  }
})
