import { db } from '../db'
import { toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
} from '../utils/cache/publicRouteCache'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'
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
      throwPublicDatabaseAwareError(event, 'public.press-dossier', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'press-dossier', { includeLocale: false }),
  }
)
