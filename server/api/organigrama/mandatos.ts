import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../../utils/externalApiCache'
import { logError } from '../../utils/logger'
import { getRequiredExternalApiBaseUrl } from '../../utils/runtimeConfig'
import { getRequestLocaleContext } from '../../utils/requestLocale'
import { externalMandatesResponseSchema } from '../../utils/validation'
import { pickLocalizedValue } from '~~/shared/utils/locale'

interface MandateOutput {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

const messagesByLocale = {
  en: {
    unavailable: 'Mandate data is temporarily unavailable.',
  },
  es: {
    unavailable: 'La información de los mandatos no está disponible temporalmente.',
  },
}

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `external-api:organigrama-mandatos-route:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/organigrama/mandatos', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.mandates-route.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const parsed = externalMandatesResponseSchema.safeParse(payload)
      if (!parsed.success) {
        logError('external.mandates-route.invalid-payload', parsed.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const mandates: MandateOutput[] = parsed.data.data
        .sort((a, b) => b.start_date.localeCompare(a.start_date))
        .map((m) => ({
          id: m.id,
          startDate: m.start_date,
          endDate: m.end_date,
          isCurrent: m.is_current,
        }))

      return {
        mandates,
        generatedAt: parsed.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
