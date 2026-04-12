import {
  ConfigError,
  requireConfigBoolean,
  requireConfigPositiveInt,
  requireConfigString,
  requireConfigUrl,
} from '~~/shared/utils/config'
import { logError } from '../utils/logger'

function collectConfigValidationErrors(): string[] {
  const runtimeConfig = useRuntimeConfig()
  const errors: string[] = []

  const checks: Array<() => void> = [
    () => requireConfigString(process.env.APP_SECRET, 'APP_SECRET'),
    () => requireConfigUrl(runtimeConfig.redisUrl, 'REDIS_URL'),
    () => requireConfigUrl(runtimeConfig.externalApiBaseUrl, 'EXTERNAL_API_BASE_URL'),
    () => requireConfigString(runtimeConfig.googleCalendarApiKey, 'GOOGLE_CALENDAR_API_KEY'),
    () => requireConfigString(runtimeConfig.googleCalendarId, 'GOOGLE_CALENDAR_ID'),
    () => requireConfigString(runtimeConfig.smtpHost, 'SMTP_HOST'),
    () => requireConfigPositiveInt(runtimeConfig.smtpPort, 'SMTP_PORT'),
    () => requireConfigBoolean(runtimeConfig.smtpSecure, 'SMTP_SECURE'),
    () => requireConfigString(runtimeConfig.smtpUser, 'SMTP_USER'),
    () => requireConfigString(runtimeConfig.smtpPass, 'SMTP_PASS'),
  ]

  for (const check of checks) {
    try {
      check()
    } catch (error) {
      if (error instanceof ConfigError) {
        errors.push(error.message)
        continue
      }

      throw error
    }
  }

  return errors
}

export default defineNitroPlugin(() => {
  const validationErrors = collectConfigValidationErrors()

  if (validationErrors.length === 0) {
    return
  }

  const formattedErrors = validationErrors.map((error) => `- ${error}`).join('\n')
  const startupError = new Error(
    ['Critical startup configuration validation failed:', formattedErrors].join('\n')
  )

  logError('startup.config-validation', startupError, {
    errorCount: validationErrors.length,
  })

  throw startupError
})
