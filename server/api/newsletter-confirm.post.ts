import { defineEventHandler, readBody, setHeader } from 'h3'
import { buildLocalizedPath } from '../utils/urlBuilder'
import { newsletterTokenQuerySchema, validateBody } from '../utils/validation'
import { performNewsletterConfirmAction } from '../utils/newsletterSubscriptionActions'

type NewsletterConfirmStatus = 'confirmed' | 'already-confirmed' | 'expired' | 'invalid'

function buildConfirmRedirect(redirectPath: string, status: NewsletterConfirmStatus) {
  const queryValue =
    status === 'confirmed' ? '1' : status === 'already-confirmed' ? 'already' : status

  return `${redirectPath}?confirmed=${queryValue}`
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const { token } = validateBody(newsletterTokenQuerySchema, await readBody(event))
  const redirectPath = buildLocalizedPath(event, '/prensa/newsletter')
  const action = await performNewsletterConfirmAction(token)
  return {
    redirectTo: buildConfirmRedirect(redirectPath, action.status),
    ...action,
  }
})
