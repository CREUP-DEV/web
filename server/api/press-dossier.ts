import { createError, setHeader } from 'h3'
import { db } from '../db'
import { isDatabaseUnavailableError } from '../utils/core/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { logError } from '../utils/core/logger'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
} from '../utils/cache/publicRouteCache'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { throwSafePublicError } from '../utils/public/publicErrors'
import { appendAssetVersion } from '../utils/core/assetVersion'

const PRESS_DOSSIER_PUBLIC_BASE = PRESS_DOSSIER_PUBLIC_PATH.slice(
  0,
  PRESS_DOSSIER_PUBLIC_PATH.lastIndexOf('/')
)

export default defineCachedEventHandler(
  async (event) => {
    try {
      const item = await db.query.pressDossier.findFirst()

      if (!item?.active || !item.pdfUrl) {
        return { data: null }
      }

      return {
        data: {
          id: item.id,
          active: item.active,
          pdfUrl: appendAssetVersion(
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: PRESS_DOSSIER_PUBLIC_BASE,
            }) ?? item.pdfUrl,
            item.updatedAt
          ),
        },
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.press-dossier.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throwSafePublicError(event, 'public.press-dossier.unexpected-error', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'press-dossier', { includeLocale: false }),
  }
)
