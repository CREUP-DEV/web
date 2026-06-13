import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'

// Carousel items

export const carouselItems = pgTable(
  'carousel_items',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    /** Nullable when the slide uses the configured site default carousel image. */
    image: text('image'),
    href: text('href').notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_carousel_items_active_order').on(table.active, table.order)]
)

export const carouselItemTranslations = pgTable(
  'carousel_item_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    buttonText: text('button_text').notNull(),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    carouselItemId: text('carousel_item_id')
      .notNull()
      .references(() => carouselItems.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.carouselItemId),
    check('carousel_item_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_carousel_item_translations_item_id').on(table.carouselItemId),
  ]
)

// Carousel relations
export const carouselItemsRelations = relations(carouselItems, ({ many }) => ({
  translations: many(carouselItemTranslations),
}))

export const carouselItemTranslationsRelations = relations(carouselItemTranslations, ({ one }) => ({
  carouselItem: one(carouselItems, {
    fields: [carouselItemTranslations.carouselItemId],
    references: [carouselItems.id],
  }),
}))

// Featured links

export const featuredLinks = pgTable(
  'featured_links',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    image: text('image').notNull(),
    to: text('to').notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_featured_links_active_order').on(table.active, table.order)]
)

export const featuredLinkTranslations = pgTable(
  'featured_link_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    featuredLinkId: text('featured_link_id')
      .notNull()
      .references(() => featuredLinks.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.featuredLinkId),
    check('featured_link_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_featured_link_translations_link_id').on(table.featuredLinkId),
  ]
)

// Featured Links relations
export const featuredLinksRelations = relations(featuredLinks, ({ many }) => ({
  translations: many(featuredLinkTranslations),
}))

export const featuredLinkTranslationsRelations = relations(featuredLinkTranslations, ({ one }) => ({
  featuredLink: one(featuredLinks, {
    fields: [featuredLinkTranslations.featuredLinkId],
    references: [featuredLinks.id],
  }),
}))
