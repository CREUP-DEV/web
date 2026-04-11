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
  date,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { SUPPORTED_LOCALE_CODES } from '../../shared/constants/locales'

const cuid = () => createId()

const SUPPORTED_LOCALE_SQL = sql.raw(
  SUPPORTED_LOCALE_CODES.map((locale) => `'${locale.replace(/'/g, "''")}'`).join(', ')
)

const buildSupportedLocaleCheck = (localeColumn: unknown) =>
  sql`${localeColumn} in (${SUPPORTED_LOCALE_SQL})`

// Enums

export const pressArticleTypeEnum = pgEnum('press_article_type', [
  'press_release',
  'statement',
  'media_appearance',
])

// Carousel items

export const carouselItems = pgTable(
  'carousel_items',
  {
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

// Tags

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
  (table) => [
    unique().on(table.locale, table.tagId),
    check('tag_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_tag_translations_tag_id').on(table.tagId),
  ]
)

// Tags relations
export const tagsRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
  pressArticles: many(pressArticleTags),
}))

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
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
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_press_articles_active_published').on(table.active, table.publishedAt),
    index('idx_press_articles_type').on(table.type),
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
    id: text('id').primaryKey().$defaultFn(cuid),
    pressArticleId: text('press_article_id')
      .notNull()
      .references(() => pressArticles.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.pressArticleId, table.tagId),
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
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [check('press_dossier_singleton_check', sql`${table.id} = 'singleton'`)]
)

// Featured links

export const featuredLinks = pgTable(
  'featured_links',
  {
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

// Admin access

export const adminAccess = pgTable('admin_access', {
  id: text('id').primaryKey().$defaultFn(cuid),
  email: text('email').notNull().unique(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Better Auth tables

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

export const sessions = pgTable(
  'sessions',
  {
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
  },
  (table) => [index('idx_sessions_user_id').on(table.userId)]
)

export const accounts = pgTable(
  'accounts',
  {
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
  },
  (table) => [index('idx_accounts_user_id').on(table.userId)]
)

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

// Team areas

export const teamAreas = pgTable('team_areas', {
  id: text('id').primaryKey().$defaultFn(cuid),
  slug: text('slug').notNull().unique(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const teamAreaTranslations = pgTable(
  'team_area_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    teamAreaId: text('team_area_id')
      .notNull()
      .references(() => teamAreas.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.teamAreaId),
    check('team_area_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_team_area_translations_area_id').on(table.teamAreaId),
  ]
)

// Team Areas relations
export const teamAreasRelations = relations(teamAreas, ({ many }) => ({
  translations: many(teamAreaTranslations),
  members: many(teamMembers),
}))

export const teamAreaTranslationsRelations = relations(teamAreaTranslations, ({ one }) => ({
  teamArea: one(teamAreas, {
    fields: [teamAreaTranslations.teamAreaId],
    references: [teamAreas.id],
  }),
}))

// Team members

export const teamMembers = pgTable(
  'team_members',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    slug: text('slug').notNull().unique(),
    email: text('email').notNull(),
    photo: text('photo'),
    calendarId: text('calendar_id'),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    teamAreaId: text('team_area_id')
      .notNull()
      .references(() => teamAreas.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_team_members_team_area_id').on(table.teamAreaId)]
)

export const teamMemberTranslations = pgTable(
  'team_member_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    fullName: text('full_name').notNull(),
    university: text('university'),
    degree: text('degree'),
    description: text('description'),
    teamMemberId: text('team_member_id')
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.teamMemberId),
    check('team_member_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_team_member_translations_member_id').on(table.teamMemberId),
  ]
)

// Team Members relations
export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  teamArea: one(teamAreas, {
    fields: [teamMembers.teamAreaId],
    references: [teamAreas.id],
  }),
  translations: many(teamMemberTranslations),
}))

export const teamMemberTranslationsRelations = relations(teamMemberTranslations, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [teamMemberTranslations.teamMemberId],
    references: [teamMembers.id],
  }),
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

// Organization members

export type OrganizationMemberSocial = { network: string; value: string }

export const organizationMembers = pgTable('organization_members', {
  id: text('id').primaryKey().$defaultFn(cuid),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  website: text('website'),
  email: text('email'),
  /** Each element must have { network: string, value: string }. */
  socials: jsonb('socials').$type<OrganizationMemberSocial[]>().default([]).notNull(),
  autonomousCommunity: text('autonomous_community').notNull(),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const organizationMemberTranslations = pgTable(
  'organization_member_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    university: text('university').notNull(),
    organizationMemberId: text('organization_member_id')
      .notNull()
      .references(() => organizationMembers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('organization_member_translations_locale_member_unique').on(
      table.locale,
      table.organizationMemberId
    ),
    check('organization_member_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_organization_member_translations_member_id').on(table.organizationMemberId),
  ]
)

// Organization Members relations
export const organizationMembersRelations = relations(organizationMembers, ({ many }) => ({
  translations: many(organizationMemberTranslations),
}))

export const organizationMemberTranslationsRelations = relations(
  organizationMemberTranslations,
  ({ one }) => ({
    organizationMember: one(organizationMembers, {
      fields: [organizationMemberTranslations.organizationMemberId],
      references: [organizationMembers.id],
    }),
  })
)

// Newsletters

export const newsletters = pgTable(
  'newsletters',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    /** Stable year-month key (YYYY-MM) used to prevent duplicates */
    monthKey: text('month_key').notNull().unique(),
    /** Month the newsletter covers (stored as first day of month) */
    month: timestamp('month', { mode: 'date' }).notNull(),
    coverImage: text('cover_image').notNull(),
    pdfUrl: text('pdf_url').notNull(),
    /** Controls whether the newsletter can be sent to subscribers */
    active: boolean('active').default(true).notNull(),
    /** Controls whether the newsletter is visible in the public archive and sitemap */
    publicVisible: boolean('public_visible').default(false).notNull(),
    /**
     * A non-null worker token signals "delivery in progress."
     * The `sending` boolean was redundant with this token; it has been removed.
     * Use `lastDeliveryWorkerToken IS NOT NULL` to check delivery state.
     */
    sentAt: timestamp('sent_at', { mode: 'date' }),
    lastDeliveryStartedAt: timestamp('last_delivery_started_at', { mode: 'date' }),
    lastDeliveryHeartbeatAt: timestamp('last_delivery_heartbeat_at', { mode: 'date' }),
    lastDeliveryFinishedAt: timestamp('last_delivery_finished_at', { mode: 'date' }),
    lastDeliveryTotal: integer('last_delivery_total'),
    lastDeliverySentCount: integer('last_delivery_sent_count'),
    lastDeliveryErrorCount: integer('last_delivery_error_count'),
    /** Array of email addresses that failed delivery (stored as JSONB). */
    lastDeliveryFailedRecipients: jsonb('last_delivery_failed_recipients').$type<string[]>(),
    lastDeliveryWorkerToken: text('last_delivery_worker_token'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_newsletters_active_sent_worker').on(
      table.active,
      table.sentAt,
      table.lastDeliveryWorkerToken
    ),
    index('idx_newsletters_public_visible_month').on(table.publicVisible, table.month),
  ]
)

// Newsletter subscribers

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    email: text('email').notNull().unique(),
    active: boolean('active').default(false).notNull(),
    subscribedAt: timestamp('subscribed_at', { mode: 'date' }).defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at', { mode: 'date' }),
    unsubscribedAt: timestamp('unsubscribed_at', { mode: 'date' }),
    /**
     * Pending double opt-in confirmation token.
     * New confirmation links are signed and not stored in clear; this column
     * remains for legacy rows that still need to be consumed or expired.
     * UNIQUE so legacy tokens cannot collide.
     */
    confirmToken: text('confirm_token').unique(),
    /** Expiry timestamp for the confirmation token (48h TTL) */
    confirmTokenExpiresAt: timestamp('confirm_token_expires_at', { mode: 'date' }),
    /**
     * Legacy unsubscribe token column kept for backward compatibility with
     * old email links. New flows use signed tokens and leave this NULL.
     */
    unsubscribeToken: text('unsubscribe_token').unique(),
    /** Minimal evidence to demonstrate the consent request */
    consentIp: text('consent_ip'),
    consentUserAgent: text('consent_user_agent'),
    consentSource: text('consent_source').default('web_form').notNull(),
    consentTextVersion: text('consent_text_version').default('2026-03-06').notNull(),
    ageConfirmed: boolean('age_confirmed').default(false).notNull(),
    locale: text('locale'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_newsletter_subscribers_active_subscribed').on(table.active, table.subscribedAt),
    check(
      'newsletter_subscribers_consent_source_check',
      sql`${table.consentSource} in ('web_form', 'email_link', 'admin_manual', 'legacy_import', 'system')`
    ),
    check(
      'newsletter_subscribers_locale_check',
      sql`${table.locale} IS NULL OR ${buildSupportedLocaleCheck(table.locale)}`
    ),
  ]
)

export const newsletterSubscriptionEvents = pgTable(
  'newsletter_subscription_events',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    subscriberId: text('subscriber_id').references(() => newsletterSubscribers.id, {
      onDelete: 'set null',
    }),
    email: text('email').notNull(),
    eventType: text('event_type').notNull(),
    eventSource: text('event_source').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_newsletter_subscription_events_subscriber_created').on(
      table.subscriberId,
      table.createdAt
    ),
    index('idx_newsletter_subscription_events_email').on(table.email),
    check(
      'newsletter_subscription_events_type_check',
      sql`${table.eventType} in (
        'requested',
        'confirmed',
        'unsubscribed',
        'admin_created',
        'admin_updated',
        'admin_deleted',
        'confirmation_expired'
      )`
    ),
    check(
      'newsletter_subscription_events_source_check',
      sql`${table.eventSource} in ('web_form', 'email_link', 'admin_manual', 'legacy_import', 'system')`
    ),
  ]
)

export const newsletterDeliveries = pgTable(
  'newsletter_deliveries',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    newsletterId: text('newsletter_id')
      .notNull()
      .references(() => newsletters.id, { onDelete: 'cascade' }),
    subscriberId: text('subscriber_id')
      .notNull()
      .references(() => newsletterSubscribers.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { mode: 'date' }),
    sentAt: timestamp('sent_at', { mode: 'date' }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('newsletter_deliveries_newsletter_subscriber_unique').on(
      table.newsletterId,
      table.subscriberId
    ),
    index('idx_newsletter_deliveries_status').on(table.newsletterId, table.status),
    index('idx_newsletter_deliveries_subscriber').on(table.subscriberId),
    check(
      'newsletter_deliveries_status_check',
      sql`${table.status} in ('queued', 'sending', 'sent', 'failed')`
    ),
  ]
)

// Media outlets

export const mediaOutlets = pgTable('media_outlets', {
  id: text('id').primaryKey().$defaultFn(cuid),
  name: text('name').notNull(),
  website: text('website').notNull(),
  logo: text('logo').notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Media Outlets relations
export const mediaOutletsRelations = relations(mediaOutlets, ({ many }) => ({
  pressArticles: many(pressArticles),
}))

// About page

export const aboutPageContent = pgTable(
  'about_page_content',
  {
    /** Fixed singleton row — always 'singleton'. Enforced by CHECK constraint. */
    id: text('id').primaryKey().default('singleton'),
    heroImage: text('hero_image'),
    heroVisible: boolean('hero_visible').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
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
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
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
    approvedAt: timestamp('approved_at', { mode: 'date' }).notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_financial_reports_active_order').on(table.active, table.order)]
)

export const financialReportTranslations = pgTable(
  'financial_report_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
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
