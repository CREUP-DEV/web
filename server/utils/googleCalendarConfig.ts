import { createError } from 'h3'
import { ConfigError, requireConfigString } from '~~/shared/utils/config'
import { logError } from './logger'

const rethrowGoogleCalendarConfigError = (error: unknown, publicMessage: string): never => {
  if (error instanceof ConfigError) {
    logError('google-calendar.config', error)
    throw createError({
      statusCode: 500,
      message: publicMessage,
    })
  }

  throw error
}

export const getRequiredGoogleCalendarApiKey = (
  publicMessage = 'Google Calendar is not configured.'
) => {
  try {
    const runtimeConfig = useRuntimeConfig()
    return requireConfigString(runtimeConfig.googleCalendarApiKey, 'GOOGLE_CALENDAR_API_KEY')
  } catch (error) {
    return rethrowGoogleCalendarConfigError(error, publicMessage)
  }
}

export const getRequiredGoogleCalendarId = (
  publicMessage = 'Google Calendar is not configured.'
) => {
  try {
    const runtimeConfig = useRuntimeConfig()
    return requireConfigString(runtimeConfig.googleCalendarId, 'GOOGLE_CALENDAR_ID')
  } catch (error) {
    return rethrowGoogleCalendarConfigError(error, publicMessage)
  }
}
