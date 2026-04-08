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
