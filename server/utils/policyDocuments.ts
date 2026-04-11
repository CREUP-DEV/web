import type { H3Event } from 'h3'
import { fetchExternalDocumentCollection } from './externalDocumentCollection'
import { toPolicyDocumentPublicPdfPathAsync } from './policyDocumentDownloads'
import { externalPolicyDocumentsResponseSchema } from './validation'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from './publicRouteCache'

const POLICY_DOCUMENTS_CACHE_VERSION = 2

interface PolicyDocumentFile {
  name: string | null
  url: string | null
}

interface PolicyDocumentOutput {
  order: number
  name: string
  date: string
  assembly: string | null
  file: PolicyDocumentFile | null
}

const POLICY_DOCUMENT_COLLECTIONS = {
  'informes-ejecutivos': {
    apiPath: '/api/informes-ejecutivos',
    label: 'Informes Ejecutivos',
  },
  posicionamientos: {
    apiPath: '/api/posicionamientos',
    label: 'Posicionamientos',
  },
  resoluciones: {
    apiPath: '/api/resoluciones',
    label: 'Resoluciones',
  },
} as const

type PolicyDocumentCollectionKey = keyof typeof POLICY_DOCUMENT_COLLECTIONS

export async function fetchPolicyDocuments(
  event: H3Event,
  apiPath: string,
  label: string
): Promise<{ documents: PolicyDocumentOutput[]; generatedAt: string | null }> {
  return fetchExternalDocumentCollection(event, {
    apiPath,
    cacheKey: `external-api:policy-documents:v${POLICY_DOCUMENTS_CACHE_VERSION}:${apiPath}`,
    errorMessageKey: 'policyDocumentsUnavailable',
    fetchLogKey: 'external.policy-documents.fetch',
    invalidPayloadLogKey: 'external.policy-documents.invalid-payload',
    logMeta: { label },
    responseSchema: externalPolicyDocumentsResponseSchema,
    transform: async (parsedPayload) => {
      const sortedDocuments = [...parsedPayload.data].sort((a, b) => a.order - b.order)

      const documents: PolicyDocumentOutput[] = await Promise.all(
        sortedDocuments.map(async (doc) => ({
          order: doc.order,
          name: doc.name,
          date: doc.date,
          assembly: doc.assembly ?? null,
          file: doc.file
            ? {
                name: doc.file.name ?? null,
                url: await toPolicyDocumentPublicPdfPathAsync(event, apiPath, doc.file.url ?? null),
              }
            : null,
        }))
      )

      return {
        documents,
        generatedAt: parsedPayload.generated_at ?? null,
      }
    },
  })
}

export function fetchPolicyDocumentCollection(
  event: H3Event,
  collection: PolicyDocumentCollectionKey
) {
  const config = POLICY_DOCUMENT_COLLECTIONS[collection]
  return fetchPolicyDocuments(event, config.apiPath, config.label)
}

export function createPolicyDocumentCollectionRouteHandler(
  collection: PolicyDocumentCollectionKey
) {
  return defineCachedEventHandler(
    async (event: H3Event) => fetchPolicyDocumentCollection(event, collection),
    {
      ...PUBLIC_ROUTE_CACHE_OPTIONS,
      getKey: (event: H3Event) =>
        buildPublicRouteCacheKey(event, collection, { includeLocale: false }),
    }
  )
}
