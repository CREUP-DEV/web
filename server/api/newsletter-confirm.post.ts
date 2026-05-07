import { defineEventHandler, readBody, setHeader } from 'h3'
import { buildLocalizedPath } from '../utils/core/urlBuilder'
import { newsletterTokenQuerySchema, validatePublicBody } from '../utils/validation'
import { performNewsletterConfirmAction } from '../utils/newsletter/newsletterSubscriptionActions'
import { enforceRateLimit } from '../utils/public/rateLimit'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'

type NewsletterConfirmStatus = 'confirmed' | 'already-confirmed' | 'expired' | 'invalid'

function buildConfirmRedirect(redirectPath: string, status: NewsletterConfirmStatus) {
  const queryValue =
    status === 'confirmed' ? '1' : status === 'already-confirmed' ? 'already' : status

  return `${redirectPath}?confirmed=${queryValue}`
}

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    namespace: 'newsletter-confirm',
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
    errorMessage: getPublicApiErrorMessage(event, 'tooManyAttempts'),
  })

  setHeader(event, 'cache-control', 'no-store')

  // Confirmation uses a one-time email token and rate limiting, so Turnstile
  // is intentionally not required here.
  const { token } = validatePublicBody(event, newsletterTokenQuerySchema, await readBody(event))
  const redirectPath = buildLocalizedPath(event, '/prensa/newsletter')
  const action = await performNewsletterConfirmAction(token)
  return {
    data: {
      ...action,
      redirectTo: buildConfirmRedirect(redirectPath, action.status),
    },
  }
})
