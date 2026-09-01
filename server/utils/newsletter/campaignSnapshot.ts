import { eq, inArray } from 'drizzle-orm'
import type { db } from '../../db'
import {
  activityEntries,
  activityEntryTranslations,
  areaReportEditions,
  areaReports,
  areaReportTranslations,
  pressArticles,
  pressArticleTranslations,
} from '../../db/schema'
import type {
  NewsletterCampaignItemLocaleSnapshot,
  NewsletterCampaignItemSnapshot,
} from '../../db/schema/newsletterCampaigns'
import type { NewsletterCampaignItemType } from '~~/shared/constants/newsletterCampaigns'
import { NEWSLETTER_CAMPAIGN_DERIVED_EXCERPT_LENGTH } from '~~/shared/constants/newsletterCampaigns'
import {
  ACTIVITY_PUBLIC_BASE_PATH,
  AREA_REPORTS_PUBLIC_BASE_PATH,
} from '~~/shared/constants/activity'
import { PRESS_ARTICLE_PUBLIC_LIST_PATHS } from '~~/shared/constants/pressRoutes'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import { DEFAULT_LOCALE_CODE, LOCALE_DEFINITIONS } from '~~/shared/constants/locales'
import { pickLocalizedValue, resolveLanguageTag } from '~~/shared/utils/locale'
import { extractPlainText } from '../press/pressTranslation'
import {
  getSiteDefaultImageEntry,
  loadSiteDefaultImageEntriesMap,
} from '../admin/siteDefaultImages'

/**
 * Freezes the selected content into the per-item snapshot the email is rendered from.
 *
 * Everything here happens once, when the send is requested — never per recipient and never at
 * render time. That is what makes a retry three hours later send exactly what the first attempt
 * sent, and what stops a piece unpublished mid-send from blanking out in half the mailboxes.
 *
 * The snapshot is *dense*: every supported locale is present with the Spanish fallback already
 * applied, so neither the mailer nor the click route re-resolves anything.
 */

/**
 * The transaction handle the caller is already inside. Typed as the handle rather than something
 * structural so passing a bare `db` is a compile error: the row locks would be taken in an implicit
 * single-statement transaction and released before the snapshot that depends on them is written.
 */
type SnapshotExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0]

export interface CampaignItemOverride {
  locale: string
  titleOverride: string | null
  excerptOverride: string | null
}

export interface CampaignItemInput {
  /** `newsletter_campaign_items.id` — the key the resulting snapshot is returned under. */
  id: string
  itemType: NewsletterCampaignItemType
  itemId: string
  overrides: CampaignItemOverride[]
}

export interface UnavailableCampaignItem {
  id: string
  itemType: NewsletterCampaignItemType
  itemId: string
  reason: 'missing' | 'inactive'
}

export interface CampaignProjectionResult {
  snapshots: Map<string, NewsletterCampaignItemSnapshot>
  /** Items that can no longer be sent. A non-empty list must block the send, not be skipped. */
  unavailable: UnavailableCampaignItem[]
}

const LOCALE_CODES = LOCALE_DEFINITIONS.map((locale) => locale.code)

/**
 * Locking order across the three source tables. Ordering by id alone would not define a global
 * order, so two concurrent sends sharing content could deadlock; the type comes first and this
 * fixes the order between types.
 */
const LOCK_ORDER: NewsletterCampaignItemType[] = ['press', 'activity', 'area_report']

const pickText = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Groups translation rows by their parent id, keyed by locale. */
function groupTranslations<T extends { locale: string }>(rows: Array<T & { parentId: string }>) {
  const grouped = new Map<string, Map<string, T>>()

  for (const row of rows) {
    if (!grouped.has(row.parentId)) {
      grouped.set(row.parentId, new Map())
    }

    grouped.get(row.parentId)!.set(row.locale, row)
  }

  return grouped
}

const localized = <T>(byLocale: Map<string, T> | undefined, localeCode: string) =>
  byLocale?.get(localeCode) ?? byLocale?.get(DEFAULT_LOCALE_CODE)

function formatDate(value: string | Date | null | undefined, localeCode: string) {
  if (!value) {
    return null
  }

  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(resolveLanguageTag(localeCode), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(date)
}

function formatMonthKey(monthKey: string, localeCode: string) {
  const [year, month] = monthKey.split('-').map(Number)

  if (!year || !month) {
    return monthKey
  }

  const label = new Intl.DateTimeFormat(resolveLanguageTag(localeCode), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))

  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Truncates on a word boundary. Area reports have no excerpt of their own to fall back on. */
function deriveExcerpt(html: string | null | undefined) {
  const text = extractPlainText(html)

  if (!text) {
    return null
  }

  if (text.length <= NEWSLETTER_CAMPAIGN_DERIVED_EXCERPT_LENGTH) {
    return text
  }

  const clipped = text.slice(0, NEWSLETTER_CAMPAIGN_DERIVED_EXCERPT_LENGTH)
  const lastSpace = clipped.lastIndexOf(' ')

  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

function buildSnapshot(
  perLocale: (localeCode: string) => NewsletterCampaignItemLocaleSnapshot
): NewsletterCampaignItemSnapshot {
  const locales: Record<string, NewsletterCampaignItemLocaleSnapshot> = {}
  const assetPaths = new Set<string>()

  for (const localeCode of LOCALE_CODES) {
    const entry = perLocale(localeCode)
    locales[localeCode] = entry

    if (entry.imagePath) {
      assetPaths.add(entry.imagePath)
    }
  }

  return { assetPaths: [...assetPaths], locales }
}

/**
 * Resolves per-item overrides once into a locale map, applying the same Spanish fallback the rest
 * of the snapshot uses: an override written only in Spanish still overrides every locale.
 */
function buildOverrideLookup(overrides: CampaignItemOverride[]) {
  const byLocale = new Map(overrides.map((override) => [override.locale, override]))

  return (localeCode: string) => {
    const entry = byLocale.get(localeCode)
    const fallback = byLocale.get(DEFAULT_LOCALE_CODE)

    return {
      title: pickText(entry?.titleOverride) ?? pickText(fallback?.titleOverride),
      excerpt: pickText(entry?.excerptOverride) ?? pickText(fallback?.excerptOverride),
    }
  }
}

export async function projectCampaignItems(
  tx: SnapshotExecutor,
  items: CampaignItemInput[]
): Promise<CampaignProjectionResult> {
  const snapshots = new Map<string, NewsletterCampaignItemSnapshot>()
  const unavailable: UnavailableCampaignItem[] = []

  if (items.length === 0) {
    return { snapshots, unavailable }
  }

  const defaultImages = await loadSiteDefaultImageEntriesMap()
  const defaultImageFor = (scope: string, slot: string) =>
    getSiteDefaultImageEntry(defaultImages, scope, slot)?.image ?? null

  const idsByType = new Map<NewsletterCampaignItemType, string[]>()

  for (const item of items) {
    if (!idsByType.has(item.itemType)) {
      idsByType.set(item.itemType, [])
    }

    idsByType.get(item.itemType)!.push(item.itemId)
  }

  const pressRows = new Map<string, Awaited<ReturnType<typeof loadPress>>[number]>()
  const activityRows = new Map<string, Awaited<ReturnType<typeof loadActivity>>[number]>()
  const areaRows = new Map<string, Awaited<ReturnType<typeof loadAreaReports>>[number]>()

  async function loadPress(ids: string[]) {
    return tx
      .select({
        id: pressArticles.id,
        type: pressArticles.type,
        slug: pressArticles.slug,
        image: pressArticles.image,
        active: pressArticles.active,
        publishedAt: pressArticles.publishedAt,
      })
      .from(pressArticles)
      .where(inArray(pressArticles.id, ids))
      .orderBy(pressArticles.id)
      .for('share')
  }

  async function loadActivity(ids: string[]) {
    return tx
      .select({
        id: activityEntries.id,
        slug: activityEntries.slug,
        image: activityEntries.image,
        active: activityEntries.active,
        startDate: activityEntries.startDate,
        endDate: activityEntries.endDate,
      })
      .from(activityEntries)
      .where(inArray(activityEntries.id, ids))
      .orderBy(activityEntries.id)
      .for('share')
  }

  async function loadAreaReports(ids: string[]) {
    return tx
      .select({
        id: areaReports.id,
        monthKey: areaReports.monthKey,
        areaId: areaReports.areaId,
        areaNameSnapshot: areaReports.areaNameSnapshot,
        image: areaReports.image,
        active: areaReports.active,
        coversFrom: areaReportEditions.coversFrom,
      })
      .from(areaReports)
      .innerJoin(areaReportEditions, eq(areaReports.monthKey, areaReportEditions.monthKey))
      .where(inArray(areaReports.id, ids))
      .orderBy(areaReports.id)
      .for('share', { of: areaReports })
  }

  // Locks are taken type by type in a fixed order, and each query orders by id, so two concurrent
  // sends touching the same content acquire the rows in the same sequence.
  for (const itemType of LOCK_ORDER) {
    const ids = idsByType.get(itemType)

    if (!ids?.length) {
      continue
    }

    if (itemType === 'press') {
      for (const row of await loadPress(ids)) pressRows.set(row.id, row)
    } else if (itemType === 'activity') {
      for (const row of await loadActivity(ids)) activityRows.set(row.id, row)
    } else {
      for (const row of await loadAreaReports(ids)) areaRows.set(row.id, row)
    }
  }

  const [pressTranslations, activityTranslations, areaTranslations] = await Promise.all([
    pressRows.size
      ? tx
          .select({
            parentId: pressArticleTranslations.pressArticleId,
            locale: pressArticleTranslations.locale,
            title: pressArticleTranslations.title,
            description: pressArticleTranslations.description,
            alt: pressArticleTranslations.alt,
          })
          .from(pressArticleTranslations)
          .where(inArray(pressArticleTranslations.pressArticleId, [...pressRows.keys()]))
      : [],
    activityRows.size
      ? tx
          .select({
            parentId: activityEntryTranslations.activityEntryId,
            locale: activityEntryTranslations.locale,
            title: activityEntryTranslations.title,
            excerpt: activityEntryTranslations.excerpt,
            alt: activityEntryTranslations.alt,
          })
          .from(activityEntryTranslations)
          .where(inArray(activityEntryTranslations.activityEntryId, [...activityRows.keys()]))
      : [],
    areaRows.size
      ? tx
          .select({
            parentId: areaReportTranslations.areaReportId,
            locale: areaReportTranslations.locale,
            contentHtml: areaReportTranslations.contentHtml,
            alt: areaReportTranslations.alt,
          })
          .from(areaReportTranslations)
          .where(inArray(areaReportTranslations.areaReportId, [...areaRows.keys()]))
      : [],
  ])

  const pressByArticle = groupTranslations(pressTranslations)
  const activityByEntry = groupTranslations(activityTranslations)
  const areaByReport = groupTranslations(areaTranslations)

  for (const item of items) {
    const override = buildOverrideLookup(item.overrides)

    if (item.itemType === 'press') {
      const row = pressRows.get(item.itemId)

      if (!row) {
        unavailable.push({ ...item, reason: 'missing' })
        continue
      }

      if (!row.active) {
        unavailable.push({ ...item, reason: 'inactive' })
        continue
      }

      const translations = pressByArticle.get(row.id)
      const defaultImage = defaultImageFor(SITE_DEFAULT_IMAGE_SCOPE.press, row.type)
      const targetPath = `${PRESS_ARTICLE_PUBLIC_LIST_PATHS[row.type]}/${row.slug}`

      snapshots.set(
        item.id,
        buildSnapshot((localeCode) => {
          const translation = localized(translations, localeCode)
          const custom = override(localeCode)

          return {
            title: custom.title ?? pickText(translation?.title) ?? row.slug,
            excerpt: custom.excerpt ?? pickText(translation?.description),
            imagePath: row.image ?? defaultImage,
            // The default cover is generic, so it describes nothing about this piece: an empty alt
            // makes screen readers skip it instead of reading something that adds nothing.
            imageAlt: row.image ? pickText(translation?.alt) : null,
            dateLabel: formatDate(row.publishedAt, localeCode),
            targetPath,
          }
        })
      )

      continue
    }

    if (item.itemType === 'activity') {
      const row = activityRows.get(item.itemId)

      if (!row) {
        unavailable.push({ ...item, reason: 'missing' })
        continue
      }

      if (!row.active) {
        unavailable.push({ ...item, reason: 'inactive' })
        continue
      }

      const translations = activityByEntry.get(row.id)
      const defaultImage = defaultImageFor(
        SITE_DEFAULT_IMAGE_SCOPE.activity,
        SITE_DEFAULT_IMAGE_SLOT.activityEntry
      )
      const targetPath = `${ACTIVITY_PUBLIC_BASE_PATH}/${row.slug}`

      snapshots.set(
        item.id,
        buildSnapshot((localeCode) => {
          const translation = localized(translations, localeCode)
          const custom = override(localeCode)
          const start = formatDate(row.startDate, localeCode)
          const end = row.endDate ? formatDate(row.endDate, localeCode) : null

          return {
            title: custom.title ?? pickText(translation?.title) ?? row.slug,
            excerpt: custom.excerpt ?? pickText(translation?.excerpt),
            imagePath: row.image ?? defaultImage,
            imageAlt: row.image ? pickText(translation?.alt) : null,
            dateLabel: end && end !== start ? `${start} – ${end}` : start,
            targetPath,
          }
        })
      )

      continue
    }

    const row = areaRows.get(item.itemId)

    if (!row) {
      unavailable.push({ ...item, reason: 'missing' })
      continue
    }

    if (!row.active) {
      unavailable.push({ ...item, reason: 'inactive' })
      continue
    }

    const translations = areaByReport.get(row.id)
    const defaultImage = defaultImageFor(
      SITE_DEFAULT_IMAGE_SCOPE.areaReport,
      SITE_DEFAULT_IMAGE_SLOT.areaReport
    )
    // Area reports live on their edition's page rather than one of their own; the anchor is what
    // takes the reader to this specific area.
    const targetPath = `${AREA_REPORTS_PUBLIC_BASE_PATH}/${row.monthKey}#area-${row.areaId}`

    snapshots.set(
      item.id,
      buildSnapshot((localeCode) => {
        const translation = localized(translations, localeCode)
        const custom = override(localeCode)
        const areaName = pickLocalizedValue(row.areaNameSnapshot, localeCode, DEFAULT_LOCALE_CODE)
        const editionLabel = formatMonthKey(row.monthKey, localeCode)
        const coversFromLabel =
          row.coversFrom && row.coversFrom !== row.monthKey
            ? formatMonthKey(row.coversFrom, localeCode)
            : null

        return {
          // An area report carries no title of its own: the area's name is the headline.
          title: custom.title ?? areaName ?? `#${row.areaId}`,
          // Nor an excerpt. The admin is nudged to write one; this truncation is the safety net.
          excerpt: custom.excerpt ?? deriveExcerpt(translation?.contentHtml),
          imagePath: row.image ?? defaultImage,
          imageAlt: row.image ? pickText(translation?.alt) : null,
          dateLabel: coversFromLabel ? `${coversFromLabel} – ${editionLabel}` : editionLabel,
          targetPath,
        }
      })
    )
  }

  return { snapshots, unavailable }
}
