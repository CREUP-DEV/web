import { createError, defineEventHandler } from 'h3'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'

// This endpoint stays disabled. Browser flow uses /confirmar-suscripcion page,
// which auto-submits POST on mount.
export default defineEventHandler((event) => {
  throw createError({
    statusCode: 405,
    message: getPublicApiErrorMessage(event, 'methodNotAllowed'),
  })
})
