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
import { and, eq, ne } from 'drizzle-orm'
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
import {
  seedActivityEntries,
  seedAreaReportEditions,
  seedAreaReports,
  seedNewsletterEditions,
} from './data/activity'

const connectionString = requireConfigString(process.env.DATABASE_URL, 'DATABASE_URL')
const db = drizzle(connectionString, { schema })
const DAY_IN_MS = 24 * 60 * 60 * 1000

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
  const activityEntryIdBySlug = new Map<string, string>()
  for (const entry of seedActivityEntries) {
    // `created_at` is what the campaign content picker reads as the day the piece was taken on
    // (these rows carry no publication date of their own), so it holds the event's own date rather
    // than the moment the seed ran. Left at `now()` the whole migrated archive would resurface as
    // new content after every seed.
    const entryCreatedAt = new Date(`${entry.startDate}T00:00:00Z`)
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
        createdAt: entryCreatedAt,
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

      // Rows seeded before the dates were backfilled. The `ne` keeps a re-run a no-op instead of
      // touching `updated_at` on every pass.
      if (entryId) {
        await db
          .update(schema.activityEntries)
          .set({ createdAt: entryCreatedAt })
          .where(
            and(
              eq(schema.activityEntries.id, entryId),
              ne(schema.activityEntries.createdAt, entryCreatedAt)
            )
          )
      }
    }
    if (!entryId) continue
    activityEntryIdBySlug.set(entry.slug, entryId)

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
  const areaReportIdByKey = new Map<string, string>()
  // A report carries no date of its own, only the edition's anchor month, which can sit before
  // entries the same edition covers. Dating it the day before its own send keeps it under that
  // edition whatever range the edition spans.
  const areaReportCreatedAtByMonth = new Map(
    seedNewsletterEditions.map((edition) => [
      edition.monthKey,
      new Date(edition.deliveredAt.getTime() - DAY_IN_MS),
    ])
  )
  for (const report of seedAreaReports) {
    const reportCreatedAt = areaReportCreatedAtByMonth.get(report.monthKey)

    if (!reportCreatedAt) {
      throw new Error(`Area report month ${report.monthKey} has no migrated newsletter edition`)
    }

    const [created] = await db
      .insert(schema.areaReports)
      .values({
        monthKey: report.monthKey,
        areaId: report.areaId,
        areaNameSnapshot: report.areaNameSnapshot,
        areaOrderSnapshot: report.areaOrderSnapshot,
        image: report.image,
        active: true,
        createdAt: reportCreatedAt,
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

      if (reportId) {
        await db
          .update(schema.areaReports)
          .set({ createdAt: reportCreatedAt })
          .where(
            and(
              eq(schema.areaReports.id, reportId),
              ne(schema.areaReports.createdAt, reportCreatedAt)
            )
          )
      }
    }
    if (!reportId) continue
    areaReportIdByKey.set(`${report.monthKey}:${report.areaId}`, reportId)

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

  // The migrated newsletters, recorded as campaigns already sent. The content they carry went out
  // as a monthly PDF long before this model existed, so the archive is a fact about the past, not a
  // send this system performed — and the picker's "Desde el último envío" filter has to see it or
  // it would offer all 212 migrated pieces as unsent.
  //
  // Delivery counters stay empty except the one the cut-off query reads: `getLastDeliveredCampaignCutoff`
  // ignores any campaign without a positive `last_delivery_sent_count`, and that exclusion is
  // deliberate (a campaign that reached nobody must not move the cut-off). The PDF era kept no
  // per-recipient record, so 1 is a floor standing in for "it was delivered", not a measurement —
  // which is why `last_delivery_total` is left null rather than matched to it. The admin list then
  // shows "Destinatarios 0 · Enviados 1", which reads as the placeholder it is.
  //
  // Items carry no snapshot: nothing was ever frozen for these, and a snapshot's other job —
  // keeping the image of a delivered email alive after its piece is unpublished — does not apply to
  // an email that never linked here.
  let campaignItemsInserted = 0
  for (const edition of seedNewsletterEditions) {
    await db
      .insert(schema.newsletterCampaigns)
      .values({
        id: edition.campaignId,
        status: 'sent',
        sentAt: edition.deliveredAt,
        lastDeliveryStartedAt: edition.deliveredAt,
        lastDeliveryFinishedAt: edition.deliveredAt,
        lastDeliverySentCount: 1,
      })
      .onConflictDoNothing({ target: schema.newsletterCampaigns.id })

    await db
      .insert(schema.newsletterCampaignTranslations)
      .values({
        locale: 'es',
        subject: edition.subject,
        campaignId: edition.campaignId,
      })
      .onConflictDoNothing({
        target: [
          schema.newsletterCampaignTranslations.locale,
          schema.newsletterCampaignTranslations.campaignId,
        ],
      })

    const items = [
      ...edition.entrySlugs.flatMap((slug) => {
        const itemId = activityEntryIdBySlug.get(slug)
        return itemId ? [{ itemType: 'activity' as const, itemId }] : []
      }),
      ...edition.areaReportKeys.flatMap((key) => {
        const itemId = areaReportIdByKey.get(`${key.monthKey}:${key.areaId}`)
        return itemId ? [{ itemType: 'area_report' as const, itemId }] : []
      }),
    ]

    if (!items.length) continue

    const rows = await db
      .insert(schema.newsletterCampaignItems)
      .values(
        items.map((item, position) => ({
          campaignId: edition.campaignId,
          position,
          itemType: item.itemType,
          itemId: item.itemId,
        }))
      )
      .onConflictDoNothing({
        target: [
          schema.newsletterCampaignItems.campaignId,
          schema.newsletterCampaignItems.itemType,
          schema.newsletterCampaignItems.itemId,
        ],
      })
      .returning({ id: schema.newsletterCampaignItems.id })
    campaignItemsInserted += rows.length
  }
  inserted += campaignItemsInserted
  console.log(
    `   migrated newsletters: ensured ${seedNewsletterEditions.length} sent campaign(s), +${campaignItemsInserted} item(s)`
  )

  console.log(`✅ Content translations seeded (inserted ${inserted} new row(s)).`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to seed content translations.', error)
    process.exit(1)
  })
