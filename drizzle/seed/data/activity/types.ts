/**
 * Shared types for the per-newsletter "Actividad" seed modules (drizzle/seed/data/activity/*).
 *
 * Each newsletter month exports one `SeedNewsletterMonth`. The aggregator (./index.ts) flattens
 * them into the arrays drizzle/seed/content.ts consumes. Spanish-only on purpose (parents + the
 * `es` translation are seeded; the other five locales are backfilled later, mirroring the press
 * seed). Inserted idempotently (onConflictDoNothing on the natural keys), so re-running is safe.
 */

export type SeedActivityKind = 'creup' | 'member'

export interface SeedActivityTranslation {
  title: string
  excerpt?: string | null
  contentHtml?: string | null
  alt?: string | null
  imageCaption?: string | null
}

export interface SeedActivityEntry {
  /** Stable natural key (also the public URL slug); globally unique across all months. */
  slug: string
  kind: SeedActivityKind
  startDate: string // YYYY-MM-DD
  endDate?: string | null
  isOnline?: boolean
  location?: string | null
  /** Initials key into MEMBER_ORGS; required when kind === 'member', forbidden otherwise. */
  memberOrgKey?: string
  /** Storage path under public/, e.g. '/transparencia/actividad/imagenes/<slug>.webp'. Null = no image. */
  image?: string | null
  es: SeedActivityTranslation
}

/** Frozen area identity captured from the org chart of the mandate the newsletter belongs to. */
export interface SeedAreaSnapshot {
  /** org-chart area id (current mandate) or area_term_id (previous mandate). Soft ref; display uses the snapshot. */
  areaId: number
  areaNameSnapshot: Record<string, string>
  areaOrderSnapshot: number
}

export interface SeedAreaReport {
  area: SeedAreaSnapshot
  /** Storage path under public/, e.g. '/transparencia/informes-areas/imagenes/<slug>.webp'. */
  image?: string | null
  es: { contentHtml: string; alt?: string | null; imageCaption?: string | null }
}

export interface SeedNewsletterMonth {
  /** 'YYYY-MM' — anchor month (end of the covered range), matches the source newsletter. */
  monthKey: string
  /** 'YYYY-MM' — start of the covered range; null/omitted means the edition covers only `monthKey`. */
  coversFrom?: string | null
  entries: SeedActivityEntry[]
  /** Empty when the newsletter shipped no "Informe mensual de áreas" (e.g. November 2025). */
  areaReports: SeedAreaReport[]
}
