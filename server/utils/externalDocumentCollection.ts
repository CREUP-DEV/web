import type { H3Event } from 'h3'
import type { ZodType } from 'zod'
import { createError } from 'h3'
import { getPublicApiErrorMessage, type PublicApiErrorMessageKey } from './apiErrorMessages'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from './externalApiCache'
import { logError } from './logger'
import { getRequiredExternalApiBaseUrl } from './runtimeConfig'

interface FetchExternalDocumentCollectionOptions<TParsed, TResult> {
  apiPath: string
  cacheKey: string
  errorMessageKey: PublicApiErrorMessageKey
  fetchLogKey: string
  invalidPayloadLogKey: string
  logMeta?: Record<string, unknown>
  responseSchema: ZodType<TParsed>
  transform: (parsed: TParsed) => Promise<TResult> | TResult
}

export async function fetchExternalDocumentCollection<TParsed, TResult>(
  event: H3Event,
  options: FetchExternalDocumentCollectionOptions<TParsed, TResult>
): Promise<TResult> {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)
  const unavailableMessage = getPublicApiErrorMessage(event, options.errorMessageKey)

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `${options.cacheKey}:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL(options.apiPath, configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError(options.fetchLogKey, error, { endpoint, ...options.logMeta }, event)
        throw createError({
          statusCode: 502,
          message: unavailableMessage,
        })
      }

      const parsedPayload = options.responseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError(
          options.invalidPayloadLogKey,
          parsedPayload.error,
          { endpoint, ...options.logMeta },
          event
        )
        throw createError({
          statusCode: 502,
          message: unavailableMessage,
        })
      }

      return options.transform(parsedPayload.data)
    },
    cacheOptions
  )
}
