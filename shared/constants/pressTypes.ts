export const PRESS_ARTICLE_TYPES = ['press_release', 'statement', 'media_appearance'] as const

export type PressArticleType = (typeof PRESS_ARTICLE_TYPES)[number]

export const PRESS_TYPE_LABELS: Record<PressArticleType, string> = {
  press_release: 'Nota de prensa',
  statement: 'Comunicado',
  media_appearance: 'Aparición en medios',
}
