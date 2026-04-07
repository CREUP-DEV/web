import type { H3Event } from 'h3'
import { createError } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from './externalApiCache'
import { toExternalPdfProxyUrl } from './externalAssetProxy'
import { logError } from './logger'
import { getRequiredExternalApiBaseUrl } from './runtimeConfig'
import { getRequestLocaleContext } from './requestLocale'
import { externalNormativaResponseSchema } from './validation'
import { EXTERNAL_DOCUMENT_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const NORMATIVA_CACHE_VERSION = 1
const messagesByLocale = {
  en: {
    unavailable: 'Regulations data is temporarily unavailable.',
  },
  es: {
    unavailable: 'La normativa no está disponible temporalmente.',
  },
}

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
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `external-api:normativa:v${NORMATIVA_CACHE_VERSION}:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/normativa', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.normativa.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const parsedPayload = externalNormativaResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.normativa.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
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
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
}
