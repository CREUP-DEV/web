import type { PressArticleType } from '../constants/pressTypes'

/**
 * Contract of the 409 an admin create answers when the new piece's title and month already match
 * an existing one (its slug would come out as `<base>-N`). The client shows the existing piece and
 * resends with `confirmDuplicate: true` if the editor still wants it.
 *
 * Response body: `{ statusCode: 409, message, data: { code: 'possibleDuplicate', duplicate } }`.
 */
export const POSSIBLE_DUPLICATE_ERROR_CODE = 'possibleDuplicate'

export interface PossibleDuplicate {
  id: string
  /** Spanish title of the existing piece. */
  title: string
  /** Press articles only. */
  type?: PressArticleType
  /** Press articles only (date-only). */
  publishedAt?: string
  /** Activity entries only (date-only). */
  startDate?: string
}

export interface PossibleDuplicateErrorData {
  code: typeof POSSIBLE_DUPLICATE_ERROR_CODE
  duplicate: PossibleDuplicate
}

const optionalString = (value: unknown) => (typeof value === 'string' ? value : undefined)

/** Reads the duplicate out of a `$fetch` error, or `null` when the error is anything else. */
export function extractPossibleDuplicate(error: unknown): PossibleDuplicate | null {
  const data = (error as { data?: { data?: unknown } } | null)?.data?.data

  if (!data || typeof data !== 'object') {
    return null
  }

  const { code, duplicate } = data as { code?: unknown; duplicate?: unknown }

  if (code !== POSSIBLE_DUPLICATE_ERROR_CODE || !duplicate || typeof duplicate !== 'object') {
    return null
  }

  const { id, title, type, publishedAt, startDate } = duplicate as Record<string, unknown>

  if (typeof id !== 'string' || typeof title !== 'string') {
    return null
  }

  return {
    id,
    title,
    type: optionalString(type) as PressArticleType | undefined,
    publishedAt: optionalString(publishedAt),
    startDate: optionalString(startDate),
  }
}
