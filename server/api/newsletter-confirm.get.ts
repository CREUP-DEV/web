import { createError, defineEventHandler } from 'h3'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'

// This action is now a POST to prevent mail scanners from triggering confirmation.
// The confirmation link in emails points to the /confirmar-suscripcion interstitial page,
// which submits the token via POST to /api/newsletter-confirm.
export default defineEventHandler((event) => {
  throw createError({
    statusCode: 405,
    message: getPublicApiErrorMessage(event, 'methodNotAllowed'),
  })
})
