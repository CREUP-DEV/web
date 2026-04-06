import { createError, setHeader } from 'h3'
import { db } from '../db'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineCachedEventHandler(
  async (event) => {
    try {
      const item = await db.query.pressDossier.findFirst()

      if (!item?.active || !item.pdfUrl) {
        return { item: null }
      }

      return {
        item: {
          id: item.id,
          active: item.active,
          pdfUrl:
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: PRESS_DOSSIER_PUBLIC_PATH,
            }) ?? item.pdfUrl,
        },
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.press-dossier.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          statusMessage: 'Servicio temporalmente no disponible',
        })
      }

      throw error
    }
  },
  {
    maxAge: 300,
    swr: true,
    getKey: () => 'public-press-dossier',
  }
)
