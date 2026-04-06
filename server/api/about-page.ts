import { createError, defineEventHandler, setHeader } from 'h3'
import { db } from '../db'
import { externalAssociatedMembersCountResponseSchema } from '../utils/validation'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { getRequiredExternalApiBaseUrl } from '../utils/runtimeConfig'
import { logError } from '../utils/logger'
import { ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  const [content, memberCount] = await Promise.all([
    db.query.aboutPageContent.findFirst().catch((error) => {
      if (isDatabaseUnavailableError(error)) {
        logError('public.about-page.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          statusMessage: 'Servicio temporalmente no disponible',
        })
      }

      throw error
    }),
    withExternalApiSWRCache(
      `external-api:members-count:${configuredBaseUrl}`,
      async () => {
        const endpoint = new URL('/api/usuarios/asociados/numero', configuredBaseUrl).toString()

        let payload: unknown
        try {
          payload = await $fetch(endpoint)
        } catch (error) {
          logError('public.about-page.member-count.fetch', error, { endpoint }, event)
          throw error
        }

        const parsedPayload = externalAssociatedMembersCountResponseSchema.safeParse(payload)
        if (!parsedPayload.success) {
          logError(
            'public.about-page.member-count.invalid-payload',
            parsedPayload.error,
            { endpoint },
            event
          )
          throw new Error('Invalid associated members count payload')
        }

        return parsedPayload.data
      },
      cacheOptions
    ).catch((error) => {
      logError('public.about-page.member-count.unavailable', error, undefined, event)
      return null
    }),
  ])

  return {
    content: content
      ? {
          heroVisible: content.heroVisible,
          heroImage: content.heroImage
            ? toExternalImageProxyUrl(content.heroImage, {
                publicPathBase: ABOUT_IMAGE_PUBLIC_PATH,
              })
            : null,
        }
      : null,
    memberCount,
  }
})
