import {
  ConfigError,
  getOptionalConfigUrl,
  requireConfigBoolean,
  requireConfigPositiveInt,
  requireConfigString,
  requireConfigUrl,
} from '~~/shared/utils/config'
import { logError } from '../utils/core/logger'

function requireAuthBaseUrl() {
  const authBaseUrl =
    getOptionalConfigUrl(process.env.BETTER_AUTH_URL, 'BETTER_AUTH_URL') ||
    getOptionalConfigUrl(process.env.NUXT_SITE_URL, 'NUXT_SITE_URL') ||
    getOptionalConfigUrl(process.env.SITE_URL, 'SITE_URL')

  if (!authBaseUrl) {
    throw new ConfigError(
      'BETTER_AUTH_URL',
      'is missing; set BETTER_AUTH_URL, NUXT_SITE_URL, or SITE_URL'
    )
  }
}

function collectConfigValidationErrors(): string[] {
  const runtimeConfig = useRuntimeConfig()
  const errors: string[] = []

  const checks: Array<() => void> = [
    () => requireConfigString(process.env.APP_SECRET, 'APP_SECRET'),
    () => requireAuthBaseUrl(),
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
