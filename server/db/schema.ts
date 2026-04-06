import { pgTable, text, boolean, integer, timestamp, unique, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

const cuid = () => createId()

// Carousel items

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
  (table) => [unique().on(table.locale, table.carouselItemId)]
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
  (table) => [unique().on(table.locale, table.tagId)]
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
    type: text('type').notNull(), // 'press_release' | 'statement' | 'media_appearance'
    slug: text('slug').notNull().unique(),
    image: text('image').notNull(),
    pdfUrl: text('pdf_url'), // For press_release and statement
    externalUrl: text('external_url'), // For media_appearance
    mediaOutletId: text('media_outlet_id').references(() => mediaOutlets.id, {
      onDelete: 'set null',
    }),
    active: boolean('active').default(true).notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_press_articles_active_published').on(table.active, table.publishedAt),
    index('idx_press_articles_type').on(table.type),
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
  (table) => [unique().on(table.locale, table.pressArticleId)]
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
  (table) => [unique().on(table.pressArticleId, table.tagId)]
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

export const pressDossier = pgTable('press_dossier', {
  id: text('id').primaryKey().$defaultFn(cuid),
  pdfUrl: text('pdf_url'),
  active: boolean('active').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Featured links

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
  (table) => [unique().on(table.locale, table.featuredLinkId)]
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
  (table) => [unique().on(table.locale, table.teamAreaId)]
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

export const teamMembers = pgTable('team_members', {
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
})

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
  (table) => [unique().on(table.locale, table.teamMemberId)]
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

export const organizationMembers = pgTable('organization_members', {
  id: text('id').primaryKey().$defaultFn(cuid),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  website: text('website'),
  email: text('email'),
  instagram: text('instagram'),
  twitter: text('twitter'),
  facebook: text('facebook'),
  linkedin: text('linkedin'),
  tiktok: text('tiktok'),
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
    active: boolean('active').default(true).notNull(),
    sending: boolean('sending').default(false).notNull(),
    sentAt: timestamp('sent_at', { mode: 'date' }),
    lastDeliveryStartedAt: timestamp('last_delivery_started_at', { mode: 'date' }),
    lastDeliveryHeartbeatAt: timestamp('last_delivery_heartbeat_at', { mode: 'date' }),
    lastDeliveryFinishedAt: timestamp('last_delivery_finished_at', { mode: 'date' }),
    lastDeliveryTotal: integer('last_delivery_total'),
    lastDeliverySentCount: integer('last_delivery_sent_count'),
    lastDeliveryErrorCount: integer('last_delivery_error_count'),
    lastDeliveryFailedRecipients: text('last_delivery_failed_recipients'),
    lastDeliveryWorkerToken: text('last_delivery_worker_token'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_newsletters_active_sent_sending').on(table.active, table.sentAt, table.sending),
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
    /** Pending double opt-in confirmation token */
    confirmToken: text('confirm_token'),
    /** Expiry timestamp for the confirmation token (48h TTL) */
    confirmTokenExpiresAt: timestamp('confirm_token_expires_at', { mode: 'date' }),
    /** Token for one-click unsubscribe links */
    unsubscribeToken: text('unsubscribe_token').notNull().$defaultFn(cuid),
    /** Minimal evidence to demonstrate the consent request */
    consentIp: text('consent_ip'),
    consentUserAgent: text('consent_user_agent'),
    consentSource: text('consent_source').default('web_form').notNull(),
    consentTextVersion: text('consent_text_version').default('2026-03-06').notNull(),
    ageConfirmed: boolean('age_confirmed').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_subscribers_confirm_token').on(table.confirmToken),
    index('idx_subscribers_unsubscribe_token').on(table.unsubscribeToken),
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

export const aboutPageContent = pgTable('about_page_content', {
  id: text('id').primaryKey().$defaultFn(cuid),
  heroImage: text('hero_image'),
  heroVisible: boolean('hero_visible').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

// Equality documents

export const equalityDocuments = pgTable('equality_documents', {
  id: text('id').primaryKey().$defaultFn(cuid),
  pdfUrl: text('pdf_url').notNull(),
  order: integer('order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

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
  (table) => [unique().on(table.locale, table.equalityDocumentId)]
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

export const financialReports = pgTable('financial_reports', {
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
})

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
  (table) => [unique().on(table.locale, table.financialReportId)]
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
