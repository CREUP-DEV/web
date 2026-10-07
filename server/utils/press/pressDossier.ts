import { toExternalPdfProxyUrl } from '../external/externalAssetUrl'
import { appendAssetVersion } from '../core/assetVersion'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

/**
 * Folder dossiers were stored in before PRESS_DOSSIER_STORAGE_PATH: straight under /prensa, beside
 * the press folders, where no volume kept them across container recreations.
 */
export const LEGACY_PRESS_DOSSIER_BASE = PRESS_DOSSIER_PUBLIC_PATH.slice(
  0,
  PRESS_DOSSIER_PUBLIC_PATH.lastIndexOf('/')
)

/** A dossier still stored at the legacy location, until the admin uploads it again. */
export function isLegacyPressDossierPath(pdfUrl: string | null | undefined) {
  const normalized = pdfUrl?.trim()
  const prefix = `${LEGACY_PRESS_DOSSIER_BASE}/`

  return Boolean(normalized?.startsWith(prefix) && !normalized.slice(prefix.length).includes('/'))
}

/** The dossier's public URL, versioned by its last update so no cache serves a replaced file. */
export function getPressDossierPublicUrl(item: {
  pdfUrl: string
  updatedAt: Date | string | null
}) {
  return (
    appendAssetVersion(
      toExternalPdfProxyUrl(item.pdfUrl, { publicPathBase: LEGACY_PRESS_DOSSIER_BASE }) ??
        item.pdfUrl,
      item.updatedAt
    ) ?? item.pdfUrl
  )
}
