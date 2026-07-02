import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
  check,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'

// Tags

export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(cuid),
  slug: text('slug').notNull().unique(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
})

export const tagTranslations = pgTable(
  'tag_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.tagId),
    check('tag_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_tag_translations_tag_id').on(table.tagId),
  ]
)

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
}))

/**
 * Configurable fallback images keyed by `(scope, slot)` — press types, newsletter cover, carousel slide, SEO image.
 * Rows are seeded for every known slot; `image` may be null until an admin uploads one.
 */
export const siteDefaultImages = pgTable(
  'site_default_images',
  {
    scope: text('scope').notNull(),
    slot: text('slot').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    primaryKey({ columns: [table.scope, table.slot] }),
    check(
      'site_default_images_scope_slot_check',
      sql`(${table.scope}, ${table.slot}) IN (
        ('press', 'press_release'),
        ('press', 'statement'),
        ('press', 'media_appearance'),
        ('newsletter', 'cover'),
        ('carousel', 'slide'),
        ('seo', 'og_image'),
        ('activity', 'entry'),
        ('area_report', 'report')
      )`
    ),
  ]
)

// About page

export const aboutPageContent = pgTable(
  'about_page_content',
  {
    /** Fixed singleton row — always 'singleton'. Enforced by CHECK constraint. */
    id: text('id').primaryKey().default('singleton'),
    heroImage: text('hero_image'),
    heroVisible: boolean('hero_visible').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [check('about_page_content_singleton_check', sql`${table.id} = 'singleton'`)]
)

// Equality documents

export const equalityDocuments = pgTable(
  'equality_documents',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    pdfUrl: text('pdf_url').notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_equality_documents_active_order').on(table.active, table.order)]
)

export const equalityDocumentTranslations = pgTable(
  'equality_document_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    meta: text('meta'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    equalityDocumentId: text('equality_document_id')
      .notNull()
      .references(() => equalityDocuments.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.equalityDocumentId),
    check('equality_document_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_equality_document_translations_document_id').on(table.equalityDocumentId),
  ]
)

export const equalityDocumentsRelations = relations(equalityDocuments, ({ many }) => ({
  translations: many(equalityDocumentTranslations),
}))

export const equalityDocumentTranslationsRelations = relations(
  equalityDocumentTranslations,
  ({ one }) => ({
    equalityDocument: one(equalityDocuments, {
      fields: [equalityDocumentTranslations.equalityDocumentId],
      references: [equalityDocuments.id],
    }),
  })
)

// Financial reports

export const financialReports = pgTable(
  'financial_reports',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    pdfUrl: text('pdf_url').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true, mode: 'date' }).notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('idx_financial_reports_active_order').on(table.active, table.order),
    index('idx_financial_reports_active_approved').on(table.active, table.approvedAt),
  ]
)

export const financialReportTranslations = pgTable(
  'financial_report_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    financialReportId: text('financial_report_id')
      .notNull()
      .references(() => financialReports.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.financialReportId),
    check('financial_report_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_financial_report_translations_report_id').on(table.financialReportId),
  ]
)

export const financialReportsRelations = relations(financialReports, ({ many }) => ({
  translations: many(financialReportTranslations),
}))

export const financialReportTranslationsRelations = relations(
  financialReportTranslations,
  ({ one }) => ({
    financialReport: one(financialReports, {
      fields: [financialReportTranslations.financialReportId],
      references: [financialReports.id],
    }),
  })
)
