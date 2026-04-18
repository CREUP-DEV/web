import { createError, setHeader } from 'h3'
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
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'
import { throwSafePublicError } from '../utils/publicErrors'
import { appendAssetVersion } from '../utils/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
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
            message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
          })
        }

        throwSafePublicError(event, 'public.about-page.unexpected-error', error)
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
            throw createError({
              statusCode: 502,
              message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
            })
          }

          const parsedPayload = externalAssociatedMembersCountResponseSchema.safeParse(payload)
          if (!parsedPayload.success) {
            logError(
              'public.about-page.member-count.invalid-payload',
              parsedPayload.error,
              { endpoint },
              event
            )
            throw createError({
              statusCode: 502,
              message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
            })
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
              ? appendAssetVersion(
                  toExternalImageProxyUrl(content.heroImage, {
                    publicPathBase: ABOUT_IMAGE_PUBLIC_PATH,
                  }),
                  content.updatedAt
                )
              : null,
          }
        : null,
      memberCount,
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'about-page', { includeLocale: false }),
  }
)
