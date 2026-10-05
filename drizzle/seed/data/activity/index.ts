/**
 * Aggregator for the per-newsletter "Actividad" seed modules.
 *
 * Each `drizzle/seed/data/activity/<YYYY-MM>.ts` default-exports one `SeedNewsletterMonth`. This
 * module flattens them into the three arrays drizzle/seed/content.ts inserts, resolving each member
 * event's `memberOrgKey` into the frozen `member_org_snapshot` (logos null — see ./memberOrgs).
 *
 * To add a migrated newsletter: create its `<YYYY-MM>.ts` module and append it to MONTHS below
 * (chronological order). The fail-fast guards at the bottom catch duplicate slugs / area rows.
 */
import type { MemberOrgSnapshot, MemberOrgSource } from '../../../../server/db/schema/activity'
import type { SeedActivityKind, SeedActivityTranslation, SeedNewsletterMonth } from './types'
import { memberOrg } from './memberOrgs'

import month202409 from './2024-09'
import month202410 from './2024-10'
import month202411 from './2024-11'
import month202412 from './2024-12'
import month202502 from './2025-02'
import month202503 from './2025-03'
import month202505 from './2025-05'
import month202506 from './2025-06'
import month202509 from './2025-09'
import month202510 from './2025-10'
import month202511 from './2025-11'
import month202601 from './2026-01'
import month202602 from './2026-02'

/** Chronological list of every migrated newsletter. */
const MONTHS: SeedNewsletterMonth[] = [
  month202409,
  month202410,
  month202411,
  month202412,
  month202502,
  month202503,
  month202505,
  month202506,
  month202509,
  month202510,
  month202511,
  month202601,
  month202602,
]

export interface SeedActivityEntryResolved {
  slug: string
  kind: SeedActivityKind
  startDate: string
  endDate: string | null
  isOnline: boolean
  location: string | null
  image: string | null
  memberOrgSource: MemberOrgSource | null
  memberOrgId: string | null
  memberOrgSnapshot: MemberOrgSnapshot | null
  es: SeedActivityTranslation
}

export interface SeedAreaReportEditionResolved {
  monthKey: string
  coversFrom: string | null
}

export interface SeedAreaReportResolved {
  monthKey: string
  areaId: number
  areaNameSnapshot: Record<string, string>
  areaOrderSnapshot: number
  image: string | null
  es: { contentHtml: string; alt?: string | null; imageCaption?: string | null }
}

export const seedActivityEntries: SeedActivityEntryResolved[] = MONTHS.flatMap((month) =>
  month.entries.map((entry) => {
    let memberOrgSource: MemberOrgSource | null = null
    let memberOrgId: string | null = null
    let memberOrgSnapshot: MemberOrgSnapshot | null = null

    if (entry.kind === 'member') {
      if (!entry.memberOrgKey) {
        throw new Error(`Member entry "${entry.slug}" is missing memberOrgKey`)
      }
      const org = memberOrg(entry.memberOrgKey)
      memberOrgSource = org.source
      memberOrgId = org.id
      // Logos null on purpose: the snapshot only needs to be non-null, the public overlay renders
      // only when a logo exists, and the real versioned proxy logos are added later from admin.
      memberOrgSnapshot = {
        denomination: org.denomination,
        initials: org.initials,
        logoLight: null,
        logoDark: null,
      }
    } else if (entry.memberOrgKey) {
      throw new Error(`CREUP entry "${entry.slug}" must not set memberOrgKey`)
    }

    return {
      slug: entry.slug,
      kind: entry.kind,
      startDate: entry.startDate,
      endDate: entry.endDate ?? null,
      isOnline: entry.isOnline ?? false,
      location: entry.location ?? null,
      image: entry.image ?? null,
      memberOrgSource,
      memberOrgId,
      memberOrgSnapshot,
      es: entry.es,
    }
  })
)

// Only months that actually shipped an "Informe mensual de áreas" get an edition row. A month with
// no reports (e.g. November 2025) must NOT leave an orphan edition: the months endpoint hides it
// (inner join on active reports) but a direct URL would otherwise render an empty edition.
export const seedAreaReportEditions: SeedAreaReportEditionResolved[] = MONTHS.filter(
  (month) => month.areaReports.length > 0
).map((month) => ({
  monthKey: month.monthKey,
  coversFrom: month.coversFrom ?? null,
}))

/**
 * Prefix of every campaign id minted here. The destructive seed keys its campaign wipe on it so a
 * full reseed keeps the migrated archive instead of dropping the record of what already went out.
 */
export const SEED_NEWSLETTER_CAMPAIGN_ID_PREFIX = 'seed-nl-'

/** Spanish month names, hardcoded so the generated subjects never depend on the host's ICU data. */
const MONTH_NAMES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return `${MONTH_NAMES_ES[Number(month) - 1]} de ${year}`
}

/** `YYYY-MM-DD` -> the next day at a fixed UTC instant, so the value never shifts with the host TZ. */
function dayAfter(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day! + 1, 9, 0, 0))
}

/**
 * One record per migrated newsletter, reproducing the PDF edition that shipped its content as a
 * campaign already sent. The content picker's "Desde el último envío" filter offers only pieces
 * taken on after the last campaign that delivered something, so without these the whole migrated
 * archive would come back as if it had never gone out.
 *
 * `deliveredAt` is derived from the data rather than from `monthKey`: an edition regularly reports
 * on days outside its anchor month (the November 2024 one runs to 2024-12-01), so the day after the
 * last date it covers is the only rule that cannot place the send before its own contents.
 */
export interface SeedNewsletterEditionResolved {
  /** Stable, human-readable id so re-seeding lands on the same campaign row. */
  campaignId: string
  monthKey: string
  coversFrom: string | null
  subject: string
  deliveredAt: Date
  entrySlugs: string[]
  areaReportKeys: Array<{ monthKey: string; areaId: number }>
}

export const seedNewsletterEditions: SeedNewsletterEditionResolved[] = MONTHS.map((month) => {
  const coveredDates = month.entries
    .flatMap((entry) => [entry.startDate, entry.endDate ?? entry.startDate])
    .sort()
  const lastCoveredDate = coveredDates[coveredDates.length - 1]

  if (!lastCoveredDate) {
    throw new Error(`Newsletter ${month.monthKey} has no entries to date its delivery from`)
  }

  return {
    campaignId: `${SEED_NEWSLETTER_CAMPAIGN_ID_PREFIX}${month.monthKey}`,
    monthKey: month.monthKey,
    coversFrom: month.coversFrom ?? null,
    subject: month.coversFrom
      ? `Boletín CREUP · ${monthLabel(month.coversFrom)} – ${monthLabel(month.monthKey)}`
      : `Boletín CREUP · ${monthLabel(month.monthKey)}`,
    deliveredAt: dayAfter(lastCoveredDate),
    entrySlugs: month.entries.map((entry) => entry.slug),
    areaReportKeys: month.areaReports.map((report) => ({
      monthKey: month.monthKey,
      areaId: report.area.areaId,
    })),
  }
})

export const seedAreaReports: SeedAreaReportResolved[] = MONTHS.flatMap((month) =>
  month.areaReports.map((report) => ({
    monthKey: month.monthKey,
    areaId: report.area.areaId,
    areaNameSnapshot: report.area.areaNameSnapshot,
    areaOrderSnapshot: report.area.areaOrderSnapshot,
    image: report.image ?? null,
    es: report.es,
  }))
)

// Fail-fast integrity guards (run at import time, i.e. when the seed boots).
const slugs = seedActivityEntries.map((e) => e.slug)
const duplicateSlug = slugs.find((s, i) => slugs.indexOf(s) !== i)
if (duplicateSlug) throw new Error(`Duplicate activity entry slug across months: ${duplicateSlug}`)

const monthKeys = seedAreaReportEditions.map((e) => e.monthKey)
const duplicateMonth = monthKeys.find((m, i) => monthKeys.indexOf(m) !== i)
if (duplicateMonth) throw new Error(`Duplicate newsletter month: ${duplicateMonth}`)

const areaKeys = seedAreaReports.map((r) => `${r.monthKey}:${r.areaId}`)
const duplicateArea = areaKeys.find((k, i) => areaKeys.indexOf(k) !== i)
if (duplicateArea) throw new Error(`Duplicate area report (month:areaId): ${duplicateArea}`)

const editionMonthKeys = seedNewsletterEditions.map((e) => e.monthKey)
const duplicateEditionMonth = editionMonthKeys.find((m, i) => editionMonthKeys.indexOf(m) !== i)
if (duplicateEditionMonth)
  throw new Error(`Duplicate newsletter month in MONTHS: ${duplicateEditionMonth}`)

// Each send must fall strictly after the previous one: the cut-off is a single `max()` over the
// delivered campaigns, so an edition dated out of order would silently widen what counts as new.
for (let i = 1; i < seedNewsletterEditions.length; i += 1) {
  const previous = seedNewsletterEditions[i - 1]!
  const current = seedNewsletterEditions[i]!
  if (current.deliveredAt <= previous.deliveredAt) {
    throw new Error(
      `Newsletter ${current.monthKey} is dated ${current.deliveredAt.toISOString()}, not after ${previous.monthKey} (${previous.deliveredAt.toISOString()})`
    )
  }
}
