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

  console.log(`✅ Content translations seeded (inserted ${inserted} new row(s)).`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to seed content translations.', error)
    process.exit(1)
  })
