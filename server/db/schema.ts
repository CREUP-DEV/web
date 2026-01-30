/**
 * Drizzle ORM Schema
 * Database schema definitions for PostgreSQL
 */

import { pgTable, text, boolean, integer, timestamp, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// ============================================================================
// Helper for generating CUIDs
// ============================================================================

const cuid = () => createId()

// ============================================================================
// Carousel Items
// ============================================================================

export const carouselItems = pgTable('carousel_items', {
  id: text('id').primaryKey().$defaultFn(cuid),
  image: text('image').notNull(),
  href: text('href').notNull(),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const carouselItemTranslations = pgTable(
  'carousel_item_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    buttonText: text('button_text').notNull(),
    alt: text('alt'),
    carouselItemId: text('carousel_item_id')
      .notNull()
      .references(() => carouselItems.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.carouselItemId, table.locale)]
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

// ============================================================================
// Tags
// ============================================================================

export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(cuid),
  slug: text('slug').notNull().unique(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const tagTranslations = pgTable(
  'tag_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.tagId, table.locale)]
)

// Tags relations
export const tagsRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
  news: many(newsItems),
}))

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
}))

// ============================================================================
// News Items
// ============================================================================

export const newsItems = pgTable('news_items', {
  id: text('id').primaryKey().$defaultFn(cuid),
  image: text('image').notNull(),
  to: text('to').notNull(),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  publishedAt: timestamp('published_at', { mode: 'date' }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Junction table for News Items to Tags (many-to-many)
export const newsTags = pgTable(
  'news_tags',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    newsItemId: text('news_item_id')
      .notNull()
      .references(() => newsItems.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.newsItemId, table.tagId)]
)

export const newsItemTranslations = pgTable(
  'news_item_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    alt: text('alt'),
    newsItemId: text('news_item_id')
      .notNull()
      .references(() => newsItems.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.newsItemId, table.locale)]
)

// News relations
export const newsItemsRelations = relations(newsItems, ({ many }) => ({
  tags: many(newsTags),
  translations: many(newsItemTranslations),
}))

export const newsItemTranslationsRelations = relations(newsItemTranslations, ({ one }) => ({
  newsItem: one(newsItems, {
    fields: [newsItemTranslations.newsItemId],
    references: [newsItems.id],
  }),
}))

// News Tags (junction) relations
export const newsTagsRelations = relations(newsTags, ({ one }) => ({
  newsItem: one(newsItems, {
    fields: [newsTags.newsItemId],
    references: [newsItems.id],
  }),
  tag: one(tags, {
    fields: [newsTags.tagId],
    references: [tags.id],
  }),
}))

// ============================================================================
// Featured Links
// ============================================================================

export const featuredLinks = pgTable('featured_links', {
  id: text('id').primaryKey().$defaultFn(cuid),
  image: text('image').notNull(),
  to: text('to').notNull(),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const featuredLinkTranslations = pgTable(
  'featured_link_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    alt: text('alt'),
    featuredLinkId: text('featured_link_id')
      .notNull()
      .references(() => featuredLinks.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.featuredLinkId, table.locale)]
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

// ============================================================================
// Better Auth Tables
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { mode: 'date' }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { mode: 'date' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))
