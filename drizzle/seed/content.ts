/**
 * Idempotent content-translation seed.
 *
 * Adds the locale translations for the seed-originated content (tags, carousel, featured
 * links, equality documents, financial reports and press articles / "news") to whatever
 * parents already exist, keyed by their stable natural key, using onConflictDoNothing on
 * the (locale, parent_id) unique constraint.
 *
 * Non-destructive and safe to re-run anywhere (it never wipes and never overwrites
 * admin-entered translations), so it is the forward-only replacement for hand-written
 * content backfill migrations (cf. the frozen drizzle/0003 / 0005 SQL backfills). deploy.sh
 * runs this (ops/seed-content.mjs) on every deploy, so new locales / new seed translations
 * land automatically without the destructive full seed.
 *
 * Run with: pnpm db:seed:content
 */

import 'dotenv/config'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../../server/db/schema'
import { requireConfigString } from '../../shared/utils/config'
import {
  seedCarouselTranslations,
  seedEqualityDocumentTranslations,
  seedFeaturedLinkTranslations,
  seedFinancialReportTranslations,
  seedTagTranslations,
} from './data/seedContentTranslations'
import { seedPressArticleTranslations } from './data/seedPressTranslations'
import { seedActivityEntries, seedAreaReportEditions, seedAreaReports } from './data/activity'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')
const db = drizzle(connectionString, { schema })

async function main() {
  console.log('🌱 Seeding content translations (idempotent)...')
  let inserted = 0

  for (const [slug, translations] of Object.entries(seedTagTranslations)) {
    const [tag] = await db
      .select({ id: schema.tags.id })
      .from(schema.tags)
      .where(eq(schema.tags.slug, slug))
      .limit(1)
    if (!tag) continue

    const rows = await db
      .insert(schema.tagTranslations)
      .values(translations.map((t) => ({ locale: t.locale, name: t.name, tagId: tag.id })))
      .onConflictDoNothing({
        target: [schema.tagTranslations.locale, schema.tagTranslations.tagId],
      })
      .returning({ id: schema.tagTranslations.id })
    inserted += rows.length
  }

  for (const [href, translations] of Object.entries(seedCarouselTranslations)) {
    const [item] = await db
      .select({ id: schema.carouselItems.id })
      .from(schema.carouselItems)
      .where(eq(schema.carouselItems.href, href))
      .limit(1)
    if (!item) continue

    const rows = await db
      .insert(schema.carouselItemTranslations)
      .values(
        translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          buttonText: t.buttonText,
          carouselItemId: item.id,
        }))
      )
      .onConflictDoNothing({
        target: [
          schema.carouselItemTranslations.locale,
          schema.carouselItemTranslations.carouselItemId,
        ],
      })
      .returning({ id: schema.carouselItemTranslations.id })
    inserted += rows.length
  }

  for (const [to, translations] of Object.entries(seedFeaturedLinkTranslations)) {
    const [link] = await db
      .select({ id: schema.featuredLinks.id })
      .from(schema.featuredLinks)
      .where(eq(schema.featuredLinks.to, to))
      .limit(1)
    if (!link) continue

    const rows = await db
      .insert(schema.featuredLinkTranslations)
      .values(
        translations.map((t) => ({ locale: t.locale, title: t.title, featuredLinkId: link.id }))
      )
      .onConflictDoNothing({
        target: [
          schema.featuredLinkTranslations.locale,
          schema.featuredLinkTranslations.featuredLinkId,
        ],
      })
      .returning({ id: schema.featuredLinkTranslations.id })
    inserted += rows.length
  }

  for (const [pdfUrl, translations] of Object.entries(seedEqualityDocumentTranslations)) {
    const [document] = await db
      .select({ id: schema.equalityDocuments.id })
      .from(schema.equalityDocuments)
      .where(eq(schema.equalityDocuments.pdfUrl, pdfUrl))
      .limit(1)
    if (!document) continue

    const rows = await db
      .insert(schema.equalityDocumentTranslations)
      .values(
        translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          meta: t.meta,
          equalityDocumentId: document.id,
        }))
      )
      .onConflictDoNothing({
        target: [
          schema.equalityDocumentTranslations.locale,
          schema.equalityDocumentTranslations.equalityDocumentId,
        ],
      })
      .returning({ id: schema.equalityDocumentTranslations.id })
    inserted += rows.length
  }

  // Financial reports carry their title only in the translations table, so the Spanish
  // title (unique across the seed reports) is the natural key to find the parent.
  for (const [esTitle, translations] of Object.entries(seedFinancialReportTranslations)) {
    const [esRow] = await db
      .select({ financialReportId: schema.financialReportTranslations.financialReportId })
      .from(schema.financialReportTranslations)
      .where(
        and(
          eq(schema.financialReportTranslations.locale, 'es'),
          eq(schema.financialReportTranslations.title, esTitle)
        )
      )
      .limit(1)
    if (!esRow) continue

    const rows = await db
      .insert(schema.financialReportTranslations)
      .values(
        translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          financialReportId: esRow.financialReportId,
        }))
      )
      .onConflictDoNothing({
        target: [
          schema.financialReportTranslations.locale,
          schema.financialReportTranslations.financialReportId,
        ],
      })
      .returning({ id: schema.financialReportTranslations.id })
    inserted += rows.length
  }

  // Press articles ("news"): the seed ships Spanish inline (drizzle/seed.ts), this backfills
  // en/ca/eu/gl/val matched by the article's stable slug. content_html is intentionally left
  // null to mirror the Spanish rows (which also store no body — the scraped markup is low quality)
  // so the per-field Spanish fallback is preserved.
  let pressMatched = 0
  const pressUnmatched: string[] = []
  for (const [slug, translations] of Object.entries(seedPressArticleTranslations)) {
    const [article] = await db
      .select({ id: schema.pressArticles.id })
      .from(schema.pressArticles)
      .where(eq(schema.pressArticles.slug, slug))
      .limit(1)
    if (!article) {
      pressUnmatched.push(slug)
      continue
    }
    pressMatched++

    const rows = await db
      .insert(schema.pressArticleTranslations)
      .values(
        translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description ?? null,
          pressArticleId: article.id,
        }))
      )
      .onConflictDoNothing({
        target: [
          schema.pressArticleTranslations.locale,
          schema.pressArticleTranslations.pressArticleId,
        ],
      })
      .returning({ id: schema.pressArticleTranslations.id })
    inserted += rows.length
  }
  console.log(
    `   press articles matched ${pressMatched}/${
      Object.keys(seedPressArticleTranslations).length
    }${pressUnmatched.length ? ` (skipped ${pressUnmatched.length} unmatched slug(s))` : ''}`
  )

  // Activity entries (newsletter migration, all months). This also CREATES the parents (there is no
  // prior seed for them): each entry is upserted by its stable slug and its Spanish translation by
  // (locale, entry_id), both via onConflictDoNothing, so the whole block is idempotent. CREUP events
  // carry no organiser; member-org events carry the frozen member_org_snapshot resolved in
  // ./data/activity (logos null — added later from admin).
  let activityTranslations = 0
  for (const entry of seedActivityEntries) {
    const [created] = await db
      .insert(schema.activityEntries)
      .values({
        kind: entry.kind,
        slug: entry.slug,
        image: entry.image,
        startDate: entry.startDate,
        endDate: entry.endDate,
        isOnline: entry.isOnline,
        location: entry.location,
        memberOrgSource: entry.memberOrgSource,
        memberOrgId: entry.memberOrgId,
        memberOrgSnapshot: entry.memberOrgSnapshot,
        active: true,
      })
      .onConflictDoNothing({ target: schema.activityEntries.slug })
      .returning({ id: schema.activityEntries.id })

    let entryId = created?.id
    if (!entryId) {
      const [existing] = await db
        .select({ id: schema.activityEntries.id })
        .from(schema.activityEntries)
        .where(eq(schema.activityEntries.slug, entry.slug))
        .limit(1)
      entryId = existing?.id
    }
    if (!entryId) continue

    const rows = await db
      .insert(schema.activityEntryTranslations)
      .values({
        locale: 'es',
        title: entry.es.title,
        excerpt: entry.es.excerpt ?? null,
        // Store the author-controlled HTML as-is. The rich-text sanitizer needs the runtime DOM and
        // returns null in this standalone seed process; the public read path sanitizes on render.
        contentHtml: entry.es.contentHtml ?? null,
        alt: entry.es.alt ?? null,
        imageCaption: entry.es.imageCaption ?? null,
        activityEntryId: entryId,
      })
      .onConflictDoNothing({
        target: [
          schema.activityEntryTranslations.locale,
          schema.activityEntryTranslations.activityEntryId,
        ],
      })
      .returning({ id: schema.activityEntryTranslations.id })
    activityTranslations += rows.length
  }
  inserted += activityTranslations
  console.log(
    `   activity entries: ensured ${seedActivityEntries.length}, +${activityTranslations} es translation(s)`
  )

  // Area report editions — idempotent upsert by month_key (PK), one per migrated newsletter.
  for (const edition of seedAreaReportEditions) {
    await db
      .insert(schema.areaReportEditions)
      .values({ monthKey: edition.monthKey, coversFrom: edition.coversFrom })
      .onConflictDoNothing({ target: schema.areaReportEditions.monthKey })
  }

  // Area reports — parent by (month_key, area_id), Spanish translation by (locale, report_id).
  // areaNameSnapshot/areaOrderSnapshot are frozen here (the seed is the publish moment), so the
  // eventless seed never needs the live org-chart resolver.
  let areaReportTranslationsInserted = 0
  for (const report of seedAreaReports) {
    const [created] = await db
      .insert(schema.areaReports)
      .values({
        monthKey: report.monthKey,
        areaId: report.areaId,
        areaNameSnapshot: report.areaNameSnapshot,
        areaOrderSnapshot: report.areaOrderSnapshot,
        image: report.image,
        active: true,
      })
      .onConflictDoNothing({
        target: [schema.areaReports.monthKey, schema.areaReports.areaId],
      })
      .returning({ id: schema.areaReports.id })

    let reportId = created?.id
    if (!reportId) {
      const [existing] = await db
        .select({ id: schema.areaReports.id })
        .from(schema.areaReports)
        .where(
          and(
            eq(schema.areaReports.monthKey, report.monthKey),
            eq(schema.areaReports.areaId, report.areaId)
          )
        )
        .limit(1)
      reportId = existing?.id
    }
    if (!reportId) continue

    const rows = await db
      .insert(schema.areaReportTranslations)
      .values({
        locale: 'es',
        // Author-controlled HTML stored as-is (the seed process has no DOM for the sanitizer, which
        // would null it out); content_html is NOT NULL here and the public read path sanitizes.
        contentHtml: report.es.contentHtml,
        alt: report.es.alt ?? null,
        imageCaption: report.es.imageCaption ?? null,
        areaReportId: reportId,
      })
      .onConflictDoNothing({
        target: [schema.areaReportTranslations.locale, schema.areaReportTranslations.areaReportId],
      })
      .returning({ id: schema.areaReportTranslations.id })
    areaReportTranslationsInserted += rows.length
  }
  inserted += areaReportTranslationsInserted
  console.log(
    `   area reports: ensured ${seedAreaReports.length} across ${seedAreaReportEditions.length} edition(s), +${areaReportTranslationsInserted} es translation(s)`
  )

  console.log(`✅ Content translations seeded (inserted ${inserted} new row(s)).`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to seed content translations.', error)
    process.exit(1)
  })
