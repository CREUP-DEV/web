/**
 * Shared helper for fetching policy documents (posicionamientos, resoluciones, informes ejecutivos)
 * from the external CREUP intranet API.
 */

import type { H3Event } from 'h3'
import { createError } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from './externalApiCache'
import { toPolicyDocumentPublicPdfPathAsync } from './policyDocumentDownloads'
import { externalPolicyDocumentsResponseSchema } from './validation'

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

/**
 * Fetches policy documents from the external API for the given endpoint path.
 * @param event - The H3 event
 * @param apiPath - The external API path (e.g., '/api/posicionamientos')
 * @param label  - A human-readable label for error messages (e.g., 'Posicionamientos')
 */
export async function fetchPolicyDocuments(
  event: H3Event,
  apiPath: string,
  label: string
): Promise<{ documents: PolicyDocumentOutput[]; generatedAt: string | null }> {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  return withExternalApiSWRCache(
    `external-api:policy-documents:v${POLICY_DOCUMENTS_CACHE_VERSION}:${configuredBaseUrl}:${apiPath}`,
    async () => {
      const endpoint = new URL(apiPath, configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        console.error(`Failed to fetch external ${label} API:`, error)
        throw createError({
          statusCode: 502,
          statusMessage: `${label} data is temporarily unavailable.`,
        })
      }

      const parsedPayload = externalPolicyDocumentsResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        console.error(`Invalid payload from external ${label} API:`, parsedPayload.error.flatten())
        throw createError({
          statusCode: 502,
          statusMessage: `${label} data is temporarily unavailable.`,
        })
      }

      const sortedDocuments = [...parsedPayload.data.data].sort((a, b) => a.order - b.order)

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
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
}
