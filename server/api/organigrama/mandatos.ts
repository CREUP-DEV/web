import { createError } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../../utils/cache/externalApiCache'
import { getPublicApiErrorMessage } from '../../utils/locale/apiErrorMessages'
import { logError } from '../../utils/core/logger'
import { getRequiredExternalApiBaseUrl } from '../../utils/core/runtimeConfig'
import { externalMandatesResponseSchema } from '../../utils/validation'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../../utils/cache/publicRouteCache'

interface MandateOutput {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

export default defineCachedEventHandler(
  async (event) => {
    const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
    const cacheOptions = getExternalApiCacheOptions(event)

    setExternalApiCacheHeaders(event, cacheOptions, 0)

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
            message: getPublicApiErrorMessage(event, 'mandatesUnavailable'),
          })
        }

        const parsed = externalMandatesResponseSchema.safeParse(payload)
        if (!parsed.success) {
          logError('external.mandates-route.invalid-payload', parsed.error, { endpoint }, event)
          throw createError({
            statusCode: 502,
            message: getPublicApiErrorMessage(event, 'mandatesUnavailable'),
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
          data: mandates,
          meta: {
            generatedAt: parsed.data.generated_at ?? null,
          },
        }
      },
      cacheOptions
    )
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'organigrama-mandatos', { includeLocale: false }),
  }
)
