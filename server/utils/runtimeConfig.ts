import type { H3Event } from 'h3'
import { createError } from 'h3'
import {
  ConfigError,
  getOptionalConfigString,
  requireConfigBoolean,
  requireConfigPositiveInt,
  requireConfigString,
  requireConfigUrl,
} from '~~/shared/utils/config'
import { logError } from './logger'

export interface SmtpTransportConfig {
  auth: {
    pass: string
    user: string
  }
  host: string
  port: number
  secure: boolean
}

const getRuntimeConfig = (event?: H3Event) => (event ? useRuntimeConfig(event) : useRuntimeConfig())

const rethrowConfigError = (error: unknown, publicMessage: string): never => {
  if (error instanceof ConfigError) {
    logError('runtime-config.invalid', error)
    throw createError({
      statusCode: 500,
      message: publicMessage,
    })
  }

  throw error
}

export const getOptionalRuntimeConfigString = (value: unknown) => getOptionalConfigString(value)

export const getRequiredRuntimeConfigString = (
  value: unknown,
  key: string,
  publicMessage = 'Server configuration error.'
) => {
  try {
    return requireConfigString(value, key)
  } catch (error) {
    return rethrowConfigError(error, publicMessage)
  }
}

export const getRequiredRuntimeConfigUrl = (
  value: unknown,
  key: string,
  publicMessage = 'Server configuration error.'
) => {
  try {
    return requireConfigUrl(value, key)
  } catch (error) {
    return rethrowConfigError(error, publicMessage)
  }
}

export const getRequiredRuntimeConfigPositiveInt = (
  value: unknown,
  key: string,
  publicMessage = 'Server configuration error.'
) => {
  try {
    return requireConfigPositiveInt(value, key)
  } catch (error) {
    return rethrowConfigError(error, publicMessage)
  }
}

export const getRequiredRuntimeConfigBoolean = (
  value: unknown,
  key: string,
  publicMessage = 'Server configuration error.'
) => {
  try {
    return requireConfigBoolean(value, key)
  } catch (error) {
    return rethrowConfigError(error, publicMessage)
  }
}

export const getRequiredExternalApiBaseUrl = (
  event?: H3Event,
  publicMessage = 'External members API is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigUrl(
    runtimeConfig.externalApiBaseUrl,
    'EXTERNAL_API_BASE_URL',
    publicMessage
  )
}

export const getRequiredSiteUrl = (
  event?: H3Event,
  publicMessage = 'Site URL is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigUrl(runtimeConfig.siteUrl, 'SITE_URL', publicMessage)
}

export const getRequiredExternalAssetProxyAllowedOrigins = (
  event?: H3Event,
  publicMessage = 'External asset proxy is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigString(
    runtimeConfig.externalAssetProxyAllowedOrigins,
    'EXTERNAL_ASSET_PROXY_ALLOWED_ORIGINS',
    publicMessage
  )
}

export const getRequiredExternalAssetProxyTimeoutMs = (
  event?: H3Event,
  publicMessage = 'External asset proxy is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigPositiveInt(
    runtimeConfig.externalAssetProxyTimeoutMs,
    'EXTERNAL_ASSET_PROXY_TIMEOUT_MS',
    publicMessage
  )
}

export const getRequiredExternalAssetProxyImageMaxBytes = (
  event?: H3Event,
  publicMessage = 'External asset proxy is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigPositiveInt(
    runtimeConfig.externalAssetProxyImageMaxBytes,
    'EXTERNAL_ASSET_PROXY_IMAGE_MAX_BYTES',
    publicMessage
  )
}

export const getRequiredExternalAssetProxyPdfMaxBytes = (
  event?: H3Event,
  publicMessage = 'External asset proxy is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigPositiveInt(
    runtimeConfig.externalAssetProxyPdfMaxBytes,
    'EXTERNAL_ASSET_PROXY_PDF_MAX_BYTES',
    publicMessage
  )
}

export const getRequiredExternalApiCacheMaxAgeSeconds = (
  event?: H3Event,
  publicMessage = 'External API cache is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigPositiveInt(
    runtimeConfig.externalApiCacheMaxAgeSeconds,
    'EXTERNAL_API_CACHE_MAX_AGE_SECONDS',
    publicMessage
  )
}

export const getRequiredExternalApiCacheStaleSeconds = (
  event?: H3Event,
  publicMessage = 'External API cache is not configured.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigPositiveInt(
    runtimeConfig.externalApiCacheStaleSeconds,
    'EXTERNAL_API_CACHE_STALE_SECONDS',
    publicMessage
  )
}

export const getRequiredSmtpTransportConfig = (
  event?: H3Event,
  publicMessage = 'Server configuration error.'
): SmtpTransportConfig => {
  const runtimeConfig = getRuntimeConfig(event)

  return {
    auth: {
      pass: getRequiredRuntimeConfigString(runtimeConfig.smtpPass, 'SMTP_PASS', publicMessage),
      user: getRequiredRuntimeConfigString(runtimeConfig.smtpUser, 'SMTP_USER', publicMessage),
    },
    host: getRequiredRuntimeConfigString(runtimeConfig.smtpHost, 'SMTP_HOST', publicMessage),
    port: getRequiredRuntimeConfigPositiveInt(runtimeConfig.smtpPort, 'SMTP_PORT', publicMessage),
    secure: getRequiredRuntimeConfigBoolean(runtimeConfig.smtpSecure, 'SMTP_SECURE', publicMessage),
  }
}

export const getRequiredSmtpFromEmail = (
  event?: H3Event,
  publicMessage = 'Server configuration error.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigString(
    runtimeConfig.smtpFromEmail,
    'SMTP_FROM_EMAIL',
    publicMessage
  )
}

export const getRequiredSmtpToEmail = (
  event?: H3Event,
  publicMessage = 'Server configuration error.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigString(runtimeConfig.smtpToEmail, 'SMTP_TO_EMAIL', publicMessage)
}

export const getRequiredSmtpPressEmail = (
  event?: H3Event,
  publicMessage = 'Server configuration error.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigString(
    runtimeConfig.smtpPressEmail,
    'SMTP_PRESS_EMAIL',
    publicMessage
  )
}

export const getOptionalTurnstileSecretKey = (event?: H3Event) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getOptionalRuntimeConfigString(runtimeConfig.turnstileSecretKey)
}

export const getRequiredTurnstileSecretKey = (
  event?: H3Event,
  publicMessage = 'Server configuration error.'
) => {
  const runtimeConfig = getRuntimeConfig(event)
  return getRequiredRuntimeConfigString(
    runtimeConfig.turnstileSecretKey,
    'TURNSTILE_SECRET_KEY',
    publicMessage
  )
}
