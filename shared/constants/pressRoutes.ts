import type { PressArticleType } from './pressTypes'

export const PRESS_ARTICLE_PUBLIC_LIST_PATHS: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

export const PRESS_ARTICLE_ADMIN_CREATE_PATHS: Record<PressArticleType, string> = {
  press_release: '/admin/press/create?type=press_release',
  statement: '/admin/press/create?type=statement',
  media_appearance: '/admin/press/create?type=media_appearance',
}

export function getPressArticlePublicListPath(type: PressArticleType) {
  return PRESS_ARTICLE_PUBLIC_LIST_PATHS[type]
}

export function getPressArticleAdminCreatePath(type: PressArticleType) {
  return PRESS_ARTICLE_ADMIN_CREATE_PATHS[type]
}
