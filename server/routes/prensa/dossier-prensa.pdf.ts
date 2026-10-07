import { defineEventHandler, sendRedirect, setHeader } from 'h3'
import { db } from '../../db'
import { throwPublicAssetNotFound, tryServePublicAssetByPath } from '../../utils/public/publicAsset'
import { getPressDossierPublicUrl, isLegacyPressDossierPath } from '../../utils/press/pressDossier'

/**
 * Stable address of the press dossier, for links outside the site. The file itself is renamed on
 * every upload (dossier-prensa.pdf, dossier-prensa-2.pdf) so caches never serve a replaced copy,
 * so this redirects to whichever one is current. A dossier still stored at the legacy location
 * under /prensa is served in place until the admin uploads it again.
 */
export default defineEventHandler(async (event) => {
  const item = await db.query.pressDossier.findFirst()

  if (!item?.active || !item.pdfUrl) {
    throwPublicAssetNotFound()
  }

  if (isLegacyPressDossierPath(item.pdfUrl)) {
    const asset = await tryServePublicAssetByPath(event, item.pdfUrl)

    if (asset === null) {
      throwPublicAssetNotFound()
    }

    return asset
  }

  // The target changes with every upload, so the redirect itself must not be cached.
  setHeader(event, 'cache-control', 'no-store')
  return sendRedirect(
    event,
    getPressDossierPublicUrl({ pdfUrl: item.pdfUrl, updatedAt: item.updatedAt }),
    302
  )
})
