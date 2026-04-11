import type { H3Event } from 'h3'
import { fetchExternalDocumentCollection } from './externalDocumentCollection'
import { toExternalPdfProxyUrl } from './externalAssetProxy'
import { externalNormativaResponseSchema } from './validation'
import { EXTERNAL_DOCUMENT_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

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
    transform: (parsedPayload) => {
      const categories: NormativaCategory[] = parsedPayload.data.map((cat) => ({
        category: cat.category,
        documents: [...cat.documents]
          .sort((a, b) => a.order - b.order)
          .map((doc) => ({
            order: doc.order,
            name: doc.name,
            date: doc.date,
            assembly: doc.assembly ?? null,
            file: doc.file
              ? {
                  name: doc.file.name ?? null,
                  url: toExternalPdfProxyUrl(doc.file.url, {
                    forceProxyRelative: true,
                    publicPathBase: EXTERNAL_DOCUMENT_PUBLIC_BASE,
                  }),
                }
              : null,
          })),
      }))

      return {
        categories,
        generatedAt: parsedPayload.generated_at ?? null,
      }
    },
  })
}
