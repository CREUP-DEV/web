export const ADMIN_RICH_TEXT_MAX_HTML_LENGTH = 200_000

/**
 * Client-safe check: returns true if the HTML string contains meaningful visible text.
 * Uses regex-based stripping (no DOM/JSDOM needed) — safe for both client and server.
 * For server-side sanitized content use hasMeaningfulRichTextHtml in server/utils/pressTranslation.ts.
 */
export function hasMeaningfulHtml(value: string | null | undefined): boolean {
  return (
    String(value ?? '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(nbsp|#160);/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim().length > 0
  )
}

export function getRichTextPlainText(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function countRichTextWords(value: string | null | undefined): number {
  const plainText = getRichTextPlainText(value)

  if (!plainText) {
    return 0
  }

  return plainText.split(/\s+/).length
}

/**
 * Splits rich-text HTML into plain-text blocks (paragraphs, headings, list items, blockquotes).
 * Regex-based so it runs on both client and server. Used to compare individual content paragraphs
 * against the short description.
 */
export function splitRichTextBlocks(value: string | null | undefined): string[] {
  return String(value ?? '')
    .replace(/<\/(p|h[1-6]|li|blockquote|div)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .split('\n')
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0)
}

/** Lowercases, strips accents and punctuation, and collapses whitespace for fuzzy text comparison. */
export function normalizeForComparison(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Levenshtein edit distance (two-row DP). */
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i)
  let currentRow = new Array<number>(b.length + 1)

  for (let i = 0; i < a.length; i++) {
    currentRow[0] = i + 1
    for (let j = 0; j < b.length; j++) {
      const insertCost = currentRow[j]! + 1
      const deleteCost = previousRow[j + 1]! + 1
      const replaceCost = previousRow[j]! + (a[i] === b[j] ? 0 : 1)
      currentRow[j + 1] = Math.min(insertCost, deleteCost, replaceCost)
    }
    ;[previousRow, currentRow] = [currentRow, previousRow]
  }

  return previousRow[b.length]!
}

/** Similarity in [0, 1] from normalized Levenshtein distance (1 = identical). */
export function textSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLength
}

/** Default threshold above which the description is considered a near-duplicate of a content block. */
export const DESCRIPTION_REPEAT_SIMILARITY_THRESHOLD = 0.9
/** Minimum normalized length before the repeat check runs, to avoid flagging short generic phrases. */
const DESCRIPTION_REPEAT_MIN_LENGTH = 25

/**
 * True when the short description duplicates — exactly or with only minor differences — one of the
 * content paragraphs. The description renders directly above the content, so repeating it there is
 * redundant. Catches exact containment, whole-paragraph near-matches, and a description that is a
 * near-prefix of a longer paragraph.
 */
export function isDescriptionRepeatedInContent(
  description: string | null | undefined,
  contentHtml: string | null | undefined,
  threshold: number = DESCRIPTION_REPEAT_SIMILARITY_THRESHOLD
): boolean {
  const normalizedDescription = normalizeForComparison(description)
  if (normalizedDescription.length < DESCRIPTION_REPEAT_MIN_LENGTH) {
    return false
  }

  for (const rawBlock of splitRichTextBlocks(contentHtml)) {
    const block = normalizeForComparison(rawBlock)
    if (!block) {
      continue
    }

    if (block.includes(normalizedDescription)) {
      return true
    }

    if (textSimilarity(normalizedDescription, block) >= threshold) {
      return true
    }

    // Description as a near-prefix of a longer paragraph (block has extra trailing text).
    if (
      block.length > normalizedDescription.length &&
      textSimilarity(normalizedDescription, block.slice(0, normalizedDescription.length)) >=
        threshold
    ) {
      return true
    }
  }

  return false
}
