import type { PressArticleType } from './pressTypes'
import { ADMIN_ROUTES } from './adminRoutes'

export const PRESS_ARTICLE_PUBLIC_LIST_PATHS: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

/**
 * The press kit: a page assembled from the site's own live content (it replaced the uploaded PDF
 * dossier, whose old URL `/prensa/dossier-prensa.pdf` redirects here). Printing it yields the PDF.
 */
export const PRESS_KIT_PATH = '/prensa/dossier'
/**
 * The retired PDF dossier's URL, answered by `server/routes/prensa/dossier-prensa.pdf.ts`. The
 * folder its uploads were stored in, `/prensa/documentos/dossier/`, redirects here as well
 * (checked inside `server/routes/prensa/documentos/[...path].ts`).
 */
export const LEGACY_PRESS_DOSSIER_PDF_PATH = '/prensa/dossier-prensa.pdf'

export const PRESS_ARTICLE_ADMIN_CREATE_PATHS: Record<PressArticleType, string> = {
  press_release: `${ADMIN_ROUTES.pressCreate}?type=press_release`,
  statement: `${ADMIN_ROUTES.pressCreate}?type=statement`,
  media_appearance: `${ADMIN_ROUTES.pressCreate}?type=media_appearance`,
}

export function getPressArticlePublicListPath(type: PressArticleType) {
  return PRESS_ARTICLE_PUBLIC_LIST_PATHS[type]
}

export function getPressArticleAdminCreatePath(type: PressArticleType) {
  return PRESS_ARTICLE_ADMIN_CREATE_PATHS[type]
}
