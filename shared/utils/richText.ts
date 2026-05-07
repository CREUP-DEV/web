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
