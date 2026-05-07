import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
  check,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'
import { tags, tagTranslations } from './shared'

// Enums

export const pressArticleTypeEnum = pgEnum('press_article_type', [
  'press_release',
  'statement',
  'media_appearance',
])

// Media outlets

export const mediaOutlets = pgTable('media_outlets', {
  id: text('id').primaryKey().$defaultFn(cuid),
  name: text('name').notNull(),
  website: text('website').notNull(),
  logo: text('logo').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
})

// Media Outlets relations
export const mediaOutletsRelations = relations(mediaOutlets, ({ many }) => ({
  pressArticles: many(pressArticles),
}))

// Press articles

export const pressArticles = pgTable(
  'press_articles',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    type: pressArticleTypeEnum('type').notNull(),
    slug: text('slug').notNull().unique(),
    image: text('image'),
    pdfUrl: text('pdf_url'), // For press_release and statement
    externalUrl: text('external_url'), // For media_appearance
    mediaOutletId: text('media_outlet_id').references(() => mediaOutlets.id, {
      onDelete: 'set null',
    }),
    active: boolean('active').default(true).notNull(),
    // Use CURRENT_DATE so the default reflects the calendar date in the DB timezone,
    // not a timestamp cast — avoids off-by-one-day issues near midnight for UTC+1/+2.
    publishedAt: date('published_at')
      .default(sql`CURRENT_DATE`)
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('idx_press_articles_active_published').on(table.active, table.publishedAt),
    index('idx_press_articles_slug_active').on(table.slug, table.active),
    index('idx_press_articles_type').on(table.type),
    index('idx_press_articles_media_outlet_id').on(table.mediaOutletId),
    // Subtype invariants: media_appearance requires externalUrl and mediaOutletId
    check(
      'press_articles_media_appearance_external_url_check',
      sql`${table.type} != 'media_appearance' OR ${table.externalUrl} IS NOT NULL`
    ),
    check(
      'press_articles_media_appearance_media_outlet_check',
      sql`${table.type} != 'media_appearance' OR ${table.mediaOutletId} IS NOT NULL`
    ),
  ]
)

export const pressArticleTranslations = pgTable(
  'press_article_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    contentHtml: text('content_html'),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    pressArticleId: text('press_article_id')
      .notNull()
      .references(() => pressArticles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.pressArticleId),
    check('press_article_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_press_article_translations_article_id').on(table.pressArticleId),
    index('idx_press_article_translations_title_trgm').using(
      'gin',
      sql`${table.title} gin_trgm_ops`
    ),
    index('idx_press_article_translations_description_trgm').using(
      'gin',
      sql`${table.description} gin_trgm_ops`
    ),
  ]
)

// Junction table for Press Articles to Tags (many-to-many)
export const pressArticleTags = pgTable(
  'press_article_tags',
  {
    pressArticleId: text('press_article_id')
      .notNull()
      .references(() => pressArticles.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.pressArticleId, table.tagId] }),
    index('idx_press_article_tags_tag_id').on(table.tagId),
  ]
)

// Press Articles relations
export const pressArticlesRelations = relations(pressArticles, ({ one, many }) => ({
  translations: many(pressArticleTranslations),
  tags: many(pressArticleTags),
  mediaOutlet: one(mediaOutlets, {
    fields: [pressArticles.mediaOutletId],
    references: [mediaOutlets.id],
  }),
}))

export const pressArticleTranslationsRelations = relations(pressArticleTranslations, ({ one }) => ({
  pressArticle: one(pressArticles, {
    fields: [pressArticleTranslations.pressArticleId],
    references: [pressArticles.id],
  }),
}))

// Press Article Tags (junction) relations
export const pressArticleTagsRelations = relations(pressArticleTags, ({ one }) => ({
  pressArticle: one(pressArticles, {
    fields: [pressArticleTags.pressArticleId],
    references: [pressArticles.id],
  }),
  tag: one(tags, {
    fields: [pressArticleTags.tagId],
    references: [tags.id],
  }),
}))

// Press dossier

export const pressDossier = pgTable(
  'press_dossier',
  {
    /** Fixed singleton row — always 'singleton'. Enforced by CHECK constraint. */
    id: text('id').primaryKey().default('singleton'),
    pdfUrl: text('pdf_url'),
    active: boolean('active').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [check('press_dossier_singleton_check', sql`${table.id} = 'singleton'`)]
)

export const tagsRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
  pressArticles: many(pressArticleTags),
}))
