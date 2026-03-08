/**
 * Shared helper for fetching normativa (regulations) from the external CREUP intranet API.
 * Returns categories of documents grouped by regulation type.
 */

import type { H3Event } from 'h3'
import { createError } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from './externalApiCache'
import { toExternalPdfProxyUrl } from './externalAssetProxy'
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

/**
 * Fetches normativa from the external API, validates, and proxies file URLs.
 */
export async function fetchNormativa(
  event: H3Event
): Promise<{ categories: NormativaCategory[]; generatedAt: string | null }> {
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
    `external-api:normativa:v${NORMATIVA_CACHE_VERSION}:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/normativa', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        console.error('Failed to fetch external normativa API:', error)
        throw createError({
          statusCode: 502,
          statusMessage: 'Normativa data is temporarily unavailable.',
        })
      }

      const parsedPayload = externalNormativaResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        console.error('Invalid payload from external normativa API:', parsedPayload.error.flatten())
        throw createError({
          statusCode: 502,
          statusMessage: 'Normativa data is temporarily unavailable.',
        })
      }

      const categories: NormativaCategory[] = parsedPayload.data.data.map((cat) => ({
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
                  url: toExternalPdfProxyUrl(doc.file.url, { event }) ?? null,
                }
              : null,
          })),
      }))

      return {
        categories,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
}
