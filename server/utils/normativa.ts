import type { H3Event } from 'h3'
import { fetchExternalDocumentCollection } from './externalDocumentCollection'
import { toPolicyDocumentPublicPdfPathAsync } from './policyDocumentDownloads'
import { externalNormativaResponseSchema } from './validation'

const NORMATIVA_CACHE_VERSION = 1

interface NormativaDocumentFile {
  name: string | null
  url: string | null
}

interface NormativaDocument {
  order: number
  name: string
  date: string
  assembly: string | null
  file: NormativaDocumentFile | null
}

interface NormativaCategory {
  category: string
  documents: NormativaDocument[]
}

export async function fetchNormativa(
  event: H3Event
): Promise<{ categories: NormativaCategory[]; generatedAt: string | null }> {
  return fetchExternalDocumentCollection(event, {
    apiPath: '/api/normativa',
    cacheKey: `external-api:normativa:v${NORMATIVA_CACHE_VERSION}`,
    errorMessageKey: 'normativaUnavailable',
    fetchLogKey: 'external.normativa.fetch',
    invalidPayloadLogKey: 'external.normativa.invalid-payload',
    responseSchema: externalNormativaResponseSchema,
    transform: async (parsedPayload) => {
      const categories: NormativaCategory[] = await Promise.all(
        parsedPayload.data.map(async (cat) => ({
          category: cat.category,
          documents: await Promise.all(
            [...cat.documents]
              .sort((a, b) => a.order - b.order)
              .map(async (doc) => ({
                order: doc.order,
                name: doc.name,
                date: doc.date,
                assembly: doc.assembly ?? null,
                file: doc.file
                  ? {
                      name: doc.file.name ?? null,
                      url: await toPolicyDocumentPublicPdfPathAsync(
                        event,
                        '/api/normativa',
                        doc.file.url ?? null
                      ),
                    }
                  : null,
              }))
          ),
        }))
      )

      return {
        categories,
        generatedAt: parsedPayload.generated_at ?? null,
      }
    },
  })
}
