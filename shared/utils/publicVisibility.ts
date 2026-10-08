import { dateValueToDateOnly } from './date'

/**
 * Mirrors the public press gate in `server/api/press/[slug].ts`: active, and published on or
 * before today in Europe/Madrid (the DB session timezone `CURRENT_DATE` is evaluated in).
 * `publishedAt` is a date-only string, so the comparison is lexicographic.
 */
export function isPressArticlePublic(
  article: { active: boolean; publishedAt: string },
  now: Date = new Date()
) {
  return article.active && article.publishedAt <= dateValueToDateOnly(now)
}

/** Mirrors the public activity gate in `server/api/activity/[slug].ts`: active entries only. */
export function isActivityEntryPublic(entry: { active: boolean }) {
  return entry.active
}
