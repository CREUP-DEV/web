import { posix } from 'node:path'
import { defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { PRESS_DOCUMENT_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { PRESS_KIT_PATH } from '~~/shared/constants/pressRoutes'

/**
 * Former storage folder of the uploaded press dossier (`dossier-prensa.pdf`, `dossier-prensa-2.pdf`),
 * which the site header linked to directly. Those PDFs carry personal phone numbers and stay on the
 * press documents volume until someone deletes them, so the folder answers with the press kit.
 */
const RETIRED_DOSSIER_FOLDER = `${PRESS_DOCUMENT_PUBLIC_PATH}/dossier/`

/**
 * Checked on the decoded, normalized path the asset helper would serve, not on the route match:
 * `dossier%2F…` or a `./` segment reach this handler instead of a `dossier/` route.
 */
function isRetiredDossierPath(pathname: string) {
  let decodedPathname: string

  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    return false
  }

  return posix
    .normalize(decodedPathname.replace(/\\/g, '/'))
    .toLowerCase()
    .startsWith(RETIRED_DOSSIER_FOLDER)
}

const servePressDocument = createPublicAssetRouteHandler({ pathBase: PRESS_DOCUMENT_PUBLIC_PATH })

export default defineEventHandler((event) => {
  if (isRetiredDossierPath(getRequestURL(event).pathname)) {
    return sendRedirect(event, PRESS_KIT_PATH, 301)
  }

  return servePressDocument(event)
})
