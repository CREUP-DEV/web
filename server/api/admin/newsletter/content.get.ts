import { defineEventHandler } from 'h3'
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db } from '../../../db'
import {
  activityEntries,
  activityEntryTranslations,
  areaReportEditions,
  areaReports,
  pressArticles,
  pressArticleTranslations,
} from '../../../db/schema'
import { getPreferredTranslationValue } from '../../../utils/locale/localizedContent'
import { getLastDeliveredCampaignCutoff } from '../../../utils/newsletter/newsletterCampaigns'
import { toExternalImageProxyUrl } from '../../../utils/external/externalAssetUrl'
import { validateQuery } from '../../../utils/validation'
import { newsletterCampaignContentQuerySchema } from '~~/shared/utils/adminSchemas'
import {
  ACTIVITY_IMAGE_PUBLIC_BASE,
  AREA_REPORTS_IMAGE_PUBLIC_BASE,
  PRESS_IMAGE_PUBLIC_BASE,
} from '~~/shared/constants/assetPaths'
import { DEFAULT_LOCALE_CODE } from '~~/shared/utils/locale'
import type { NewsletterCampaignItemType } from '~~/shared/constants/newsletterCampaigns'

const DEFAULT_LIMIT = 20

/**
 * Every type searches by substring, never with the trigram `%` operator. `%` compares whole-string
 * similarity against a 0.3 threshold, so a single word never clears it against a long title:
 * measured on this database, "estudiantes" matched 2 of 464 press articles where `ilike` matched
 * 217. The gin_trgm_ops indexes accelerate `ilike '%…%'` regardless — 9ms across the same table.
 */
function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

function groupByKey<T>(rows: T[], getKey: (row: T) => string) {
  const groups = new Map<string, T[]>()

  for (const row of rows) {
    const key = getKey(row)
    const group = groups.get(key)

    if (group) {
      group.push(row)
    } else {
      groups.set(key, [row])
    }
  }

  return groups
}

interface CampaignContentEntry {
  itemType: NewsletterCampaignItemType
  itemId: string
  /** Article type for press, entry kind for activity; area reports have no sub-kind. */
  subtype: string | null
  title: string
  excerpt: string | null
  /** `YYYY-MM-DD` for press and activity, `YYYY-MM` (the edition's anchor month) for area reports. */
  date: string
  imageUrl: string | null
  /**
   * The piece carries no excerpt of its own, so the editor should write one. Always true for area
   * reports, whose translations hold rich text but neither a title nor a summary.
   */
  needsExcerptOverride: boolean
}

interface CampaignContentPage {
  entries: CampaignContentEntry[]
  total: number
}

interface ContentQueryOptions {
  /**
   * Resolve these exact pieces instead of browsing. Set when the editor rehydrates a saved
   * campaign, whose stored items hold only `itemType` + `itemId`. `active = true` still applies:
   * an id that does not come back is a piece the send would refuse, and the editor must say so.
   */
  ids?: string[]
  search?: string
  cutoff: Date | null
  limit: number
  offset: number
}

async function countRows(
  table: typeof pressArticles | typeof activityEntries | typeof areaReports,
  where: SQL | undefined
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(table)
    .where(where)

  return row?.count ?? 0
}

async function listPressArticles({
  ids,
  search,
  cutoff,
  limit,
  offset,
}: ContentQueryOptions): Promise<CampaignContentPage> {
  const conditions: SQL[] = [eq(pressArticles.active, true)]

  if (ids) {
    conditions.push(inArray(pressArticles.id, ids))
  }

  if (cutoff) {
    conditions.push(sql`${pressArticles.publishedAt} >= ${cutoff}::date`)
  }

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    // The parentheses are load-bearing: `and()` embeds this fragment verbatim, so a bare `or`
    // would bind looser than the correlation and match every row.
    const matches = sql`(${pressArticleTranslations.title} ilike ${pattern} escape '\\' or ${pressArticleTranslations.description} ilike ${pattern} escape '\\')`

    conditions.push(
      sql`exists (
        select 1
        from ${pressArticleTranslations}
        where ${and(eq(pressArticleTranslations.pressArticleId, pressArticles.id), matches)}
      )`
    )
  }

  const where = and(...conditions)

  const [rows, total] = await Promise.all([
    db
      .select({
        id: pressArticles.id,
        type: pressArticles.type,
        image: pressArticles.image,
        publishedAt: pressArticles.publishedAt,
      })
      .from(pressArticles)
      .where(where)
      .orderBy(desc(pressArticles.publishedAt), desc(pressArticles.id))
      .limit(limit)
      .offset(offset),
    countRows(pressArticles, where),
  ])

  const translations = rows.length
    ? await db
        .select({
          pressArticleId: pressArticleTranslations.pressArticleId,
          locale: pressArticleTranslations.locale,
          title: pressArticleTranslations.title,
          description: pressArticleTranslations.description,
        })
        .from(pressArticleTranslations)
        .where(
          inArray(
            pressArticleTranslations.pressArticleId,
            rows.map((row) => row.id)
          )
        )
    : []

  const byArticle = groupByKey(translations, (row) => row.pressArticleId)

  return {
    total,
    entries: rows.map((row) => {
      const rowTranslations = byArticle.get(row.id) ?? []
      const excerpt = getPreferredTranslationValue(rowTranslations, 'description') || null

      return {
        itemType: 'press' as const,
        itemId: row.id,
        subtype: row.type,
        title: getPreferredTranslationValue(rowTranslations, 'title'),
        excerpt,
        date: row.publishedAt,
        imageUrl: row.image
          ? (toExternalImageProxyUrl(row.image, { publicPathBase: PRESS_IMAGE_PUBLIC_BASE }) ??
            row.image)
          : null,
        needsExcerptOverride: excerpt === null,
      }
    }),
  }
}

async function listActivityEntries({
  ids,
  search,
  cutoff,
  limit,
  offset,
}: ContentQueryOptions): Promise<CampaignContentPage> {
  const conditions: SQL[] = [eq(activityEntries.active, true)]

  if (ids) {
    conditions.push(inArray(activityEntries.id, ids))
  }

  if (cutoff) {
    conditions.push(sql`${activityEntries.createdAt} >= ${cutoff}`)
  }

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`
    const matches = sql`(${activityEntryTranslations.title} ilike ${pattern} escape '\\' or ${activityEntryTranslations.excerpt} ilike ${pattern} escape '\\')`

    conditions.push(
      sql`exists (
        select 1
        from ${activityEntryTranslations}
        where ${and(eq(activityEntryTranslations.activityEntryId, activityEntries.id), matches)}
      )`
    )
  }

  const where = and(...conditions)

  const [rows, total] = await Promise.all([
    db
      .select({
        id: activityEntries.id,
        kind: activityEntries.kind,
        image: activityEntries.image,
        startDate: activityEntries.startDate,
      })
      .from(activityEntries)
      .where(where)
      .orderBy(desc(activityEntries.startDate), desc(activityEntries.id))
      .limit(limit)
      .offset(offset),
    countRows(activityEntries, where),
  ])

  const translations = rows.length
    ? await db
        .select({
          activityEntryId: activityEntryTranslations.activityEntryId,
          locale: activityEntryTranslations.locale,
          title: activityEntryTranslations.title,
          excerpt: activityEntryTranslations.excerpt,
        })
        .from(activityEntryTranslations)
        .where(
          inArray(
            activityEntryTranslations.activityEntryId,
            rows.map((row) => row.id)
          )
        )
    : []

  const byEntry = groupByKey(translations, (row) => row.activityEntryId)

  return {
    total,
    entries: rows.map((row) => {
      const rowTranslations = byEntry.get(row.id) ?? []
      const excerpt = getPreferredTranslationValue(rowTranslations, 'excerpt') || null

      return {
        itemType: 'activity' as const,
        itemId: row.id,
        subtype: row.kind,
        title: getPreferredTranslationValue(rowTranslations, 'title'),
        excerpt,
        date: row.startDate,
        imageUrl: row.image
          ? (toExternalImageProxyUrl(row.image, { publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE }) ??
            row.image)
          : null,
        needsExcerptOverride: excerpt === null,
      }
    }),
  }
}

/**
 * Area reports have no trigram index to lean on: their translations hold rich text but neither a
 * title nor a summary. The searchable text is the frozen area name inside the `area_name_snapshot`
 * jsonb plus the edition's month, so this is a sequential scan by design — the table holds one row
 * per area per edition, which keeps it small.
 */
async function listAreaReports({
  ids,
  search,
  cutoff,
  limit,
  offset,
}: ContentQueryOptions): Promise<CampaignContentPage> {
  const conditions: SQL[] = [eq(areaReports.active, true)]

  if (ids) {
    conditions.push(inArray(areaReports.id, ids))
  }

  if (cutoff) {
    conditions.push(sql`${areaReports.createdAt} >= ${cutoff}`)
  }

  if (search) {
    const pattern = `%${escapeLikePattern(search)}%`

    conditions.push(
      sql`(
        exists (
          select 1
          from jsonb_each_text(${areaReports.areaNameSnapshot}) as area_name(locale, value)
          where area_name.value ilike ${pattern} escape '\\'
        )
        or ${areaReports.monthKey} ilike ${pattern} escape '\\'
        or exists (
          select 1
          from ${areaReportEditions}
          where ${areaReportEditions.monthKey} = ${areaReports.monthKey}
            and ${areaReportEditions.coversFrom} ilike ${pattern} escape '\\'
        )
      )`
    )
  }

  const where = and(...conditions)

  const [rows, total] = await Promise.all([
    db
      .select({
        id: areaReports.id,
        monthKey: areaReports.monthKey,
        image: areaReports.image,
        areaNameSnapshot: areaReports.areaNameSnapshot,
      })
      .from(areaReports)
      .where(where)
      .orderBy(
        desc(areaReports.monthKey),
        asc(areaReports.areaOrderSnapshot),
        asc(areaReports.areaId)
      )
      .limit(limit)
      .offset(offset),
    countRows(areaReports, where),
  ])

  return {
    total,
    entries: rows.map((row) => {
      const names = row.areaNameSnapshot ?? {}

      return {
        itemType: 'area_report' as const,
        itemId: row.id,
        subtype: null,
        title: names[DEFAULT_LOCALE_CODE] || Object.values(names).find(Boolean) || '',
        excerpt: null,
        date: row.monthKey,
        imageUrl: row.image
          ? (toExternalImageProxyUrl(row.image, {
              publicPathBase: AREA_REPORTS_IMAGE_PUBLIC_BASE,
            }) ?? row.image)
          : null,
        needsExcerptOverride: true,
      }
    }),
  }
}

/**
 * Feeds the campaign editor's content picker, and — with `ids` — rehydrates the cards of a saved
 * campaign, whose stored items keep only `itemType` + `itemId` until the send freezes a snapshot.
 *
 * `sinceLastCampaign` offers only what was taken on
 * after the last campaign that actually delivered something (see
 * `getLastDeliveredCampaignCutoff`); with no such campaign there is no cut-off and everything is
 * offered. The date it compares against differs per type: press has a publication date, while
 * activity entries and area reports only have the moment they were entered.
 *
 * Reads go through the plain select builder rather than the relational query API: the latter
 * rewrites every column reference inside a raw `sql` fragment to the outer table's alias, which
 * breaks the correlated `exists` these filters rely on.
 */
export default defineEventHandler(async (event) => {
  const query = validateQuery(event, newsletterCampaignContentQuerySchema)

  // Resolving by id is a lookup, not a browse: the browsing filters and the paging window would
  // only be able to hide pieces the caller already named.
  const ids = query.ids
  const search = ids ? undefined : query.q?.trim() || undefined
  const cutoff = !ids && query.sinceLastCampaign ? await getLastDeliveredCampaignCutoff() : null
  const options: ContentQueryOptions = {
    ids,
    search,
    cutoff,
    limit: ids ? ids.length : (query.limit ?? DEFAULT_LIMIT),
    offset: ids ? 0 : (query.offset ?? 0),
  }

  const page =
    query.type === 'press'
      ? await listPressArticles(options)
      : query.type === 'activity'
        ? await listActivityEntries(options)
        : await listAreaReports(options)

  return {
    data: page.entries,
    meta: { total: page.total },
  }
})
