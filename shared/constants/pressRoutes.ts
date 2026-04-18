import type { PressArticleType } from './pressTypes'
import { ADMIN_ROUTES } from './adminRoutes'

export const PRESS_ARTICLE_PUBLIC_LIST_PATHS: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

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
