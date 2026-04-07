import { createError, defineEventHandler } from 'h3'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'

// This action is now a POST to prevent mail scanners from triggering unsubscription.
// The unsubscribe link in emails points to the /desuscribirse interstitial page,
// which submits the token via POST to /api/newsletter-unsubscribe.
export default defineEventHandler((event) => {
  throw createError({
    statusCode: 405,
    message: getPublicApiErrorMessage(event, 'methodNotAllowed'),
  })
})
