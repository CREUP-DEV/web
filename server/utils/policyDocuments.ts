import type { H3Event } from 'h3'
import { createError } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from './externalApiCache'
import { toPolicyDocumentPublicPdfPathAsync } from './policyDocumentDownloads'
import { getRequestLocaleContext } from './requestLocale'
import { getRequiredExternalApiBaseUrl } from './runtimeConfig'
import { externalPolicyDocumentsResponseSchema } from './validation'
import { logError } from './logger'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const POLICY_DOCUMENTS_CACHE_VERSION = 2
const messagesByLocale = {
  en: {
    unavailable: 'The requested documents are temporarily unavailable.',
  },
  es: {
    unavailable: 'La documentación solicitada no está disponible temporalmente.',
  },
}

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

export async function fetchPolicyDocuments(
  event: H3Event,
  apiPath: string,
  label: string
): Promise<{ documents: PolicyDocumentOutput[]; generatedAt: string | null }> {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `external-api:policy-documents:v${POLICY_DOCUMENTS_CACHE_VERSION}:${configuredBaseUrl}:${apiPath}`,
    async () => {
      const endpoint = new URL(apiPath, configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.policy-documents.fetch', error, { endpoint, label }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const parsedPayload = externalPolicyDocumentsResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError(
          'external.policy-documents.invalid-payload',
          parsedPayload.error,
          {
            endpoint,
            label,
          },
          event
        )
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
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
