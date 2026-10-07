import { db } from '../db'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
} from '../utils/cache/publicRouteCache'
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'
import { getPressDossierPublicUrl } from '../utils/press/pressDossier'

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
          pdfUrl: getPressDossierPublicUrl({ pdfUrl: item.pdfUrl, updatedAt: item.updatedAt }),
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
