import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../../utils/cache/publicRouteCache'
import { externalMandatesResponseSchema } from '../../utils/validation'
import { fetchExternalDocumentCollection } from '../../utils/external/externalDocumentCollection'

interface MandateOutput {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

export default defineCachedEventHandler(
  (event) =>
    fetchExternalDocumentCollection(event, {
      apiPath: '/api/organigrama/mandatos',
      cacheKey: 'external-api:organigrama-mandatos-route',
      errorMessageKey: 'mandatesUnavailable',
      fetchLogKey: 'external.mandates-route.fetch',
      invalidPayloadLogKey: 'external.mandates-route.invalid-payload',
      responseSchema: externalMandatesResponseSchema,
      transform: (parsed) => {
        const mandates: MandateOutput[] = parsed.data
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
            generatedAt: parsed.generated_at ?? null,
          },
        }
      },
    }),
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'organigrama-mandatos', { includeLocale: false }),
  }
)
