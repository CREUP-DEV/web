/**
 * Idempotent content-translation seed.
 *
 * Adds the locale translations for the seed-originated content (tags, carousel, featured
 * links, equality documents) to whatever parents already exist, keyed by their stable
 * natural key, using onConflictDoNothing on the (locale, parent_id) unique constraint.
 *
 * Non-destructive and safe to re-run anywhere (it never wipes and never overwrites
 * admin-entered translations), so it is the forward-only replacement for hand-written
 * content backfill migrations (cf. the frozen drizzle/0003 / 0005 SQL backfills).
 *
 * Run with: pnpm db:seed:content
 */

import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from '../../server/db/schema'
import { requireConfigString } from '../../shared/utils/config'
import {
  seedCarouselTranslations,
  seedEqualityDocumentTranslations,
  seedFeaturedLinkTranslations,
  seedTagTranslations,
} from './data/seedContentTranslations'

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

  console.log(`✅ Content translations seeded (inserted ${inserted} new row(s)).`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to seed content translations.', error)
    process.exit(1)
  })
