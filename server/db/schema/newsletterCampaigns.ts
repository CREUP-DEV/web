import { pgTable, text, integer, timestamp, unique, index, check, jsonb } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'
import { newsletterSubscribers } from './newsletter'
import {
  NEWSLETTER_CAMPAIGN_ITEM_TYPES,
  NEWSLETTER_CAMPAIGN_STATUSES,
} from '../../../shared/constants/newsletterCampaigns'

/**
 * Newsletter campaigns — one email assembled from content already published on the site,
 * replacing the PDF-edition model held by `newsletters`. That table and `newsletter_deliveries`
 * stay in place until the removal phase drops them (expand/contract migration).
 */

const CAMPAIGN_STATUS_SQL = sql.raw(
  NEWSLETTER_CAMPAIGN_STATUSES.map((status) => `'${status}'`).join(', ')
)

const CAMPAIGN_ITEM_TYPE_SQL = sql.raw(
  NEWSLETTER_CAMPAIGN_ITEM_TYPES.map((itemType) => `'${itemType}'`).join(', ')
)

/**
 * One locale's frozen view of a campaign item, resolved at send time with the Spanish fallback
 * already applied. Holds storage paths and unlocalized site paths, never absolute URLs: the asset
 * registry matches on storage paths, and the click route localizes the target per recipient.
 */
export interface NewsletterCampaignItemLocaleSnapshot {
  title: string
  excerpt: string | null
  imagePath: string | null
  imageAlt: string | null
  dateLabel: string | null
  targetPath: string
}

/**
 * `assetPaths` repeats the image paths of every locale as a flat, de-duplicated array. It exists so
 * the admin asset registry can find them with a single `snapshot -> 'assetPaths' ? $1` containment
 * check: its `column->>key` form cannot reach into the per-locale map.
 *
 * `locales` is dense — every supported locale is present, fallback already applied — so rendering
 * and the click route can index it without re-resolving anything at send time.
 */
export interface NewsletterCampaignItemSnapshot {
  assetPaths: string[]
  locales: Record<string, NewsletterCampaignItemLocaleSnapshot>
}

export const newsletterCampaigns = pgTable(
  'newsletter_campaigns',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    status: text('status').notNull().default('draft'),
    /**
     * Set only when the campaign finished with nothing pending. The delivery lease refuses to claim
     * a campaign that has it, so a run leaving failed deliveries ends in `failed` instead — which
     * is what keeps a retry possible.
     */
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    lastDeliveryStartedAt: timestamp('last_delivery_started_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastDeliveryHeartbeatAt: timestamp('last_delivery_heartbeat_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastDeliveryFinishedAt: timestamp('last_delivery_finished_at', {
      withTimezone: true,
      mode: 'date',
    }),
    lastDeliveryTotal: integer('last_delivery_total'),
    lastDeliverySentCount: integer('last_delivery_sent_count'),
    lastDeliveryErrorCount: integer('last_delivery_error_count'),
    lastDeliveryFailedRecipients: jsonb('last_delivery_failed_recipients').$type<string[]>(),
    lastDeliveryWorkerToken: text('last_delivery_worker_token'),
    /** Aggregate only: no record of which subscriber unsubscribed from which campaign. */
    unsubscribeCount: integer('unsubscribe_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('idx_newsletter_campaigns_sent_worker').on(table.sentAt, table.lastDeliveryWorkerToken),
    index('idx_newsletter_campaigns_status_created').on(table.status, table.createdAt),
    check('newsletter_campaigns_status_check', sql`${table.status} in (${CAMPAIGN_STATUS_SQL})`),
    // The next two are biconditionals on purpose. Plain implications would still admit `draft` with
    // a sent_at, or `sending` without a worker token — exactly the divergence between `status` and
    // the lease's own state that they exist to prevent. Consequence worth knowing before writing
    // any mutation: the worker token and the status must move in the same statement, never one
    // after the other, because the intermediate row would violate the constraint.
    check(
      'newsletter_campaigns_sent_at_status_check',
      sql`(${table.status} = 'sent') = (${table.sentAt} is not null)`
    ),
    check(
      'newsletter_campaigns_worker_token_status_check',
      sql`(${table.lastDeliveryWorkerToken} is not null) = (${table.status} in ('queued', 'sending'))`
    ),
  ]
)

export const newsletterCampaignTranslations = pgTable(
  'newsletter_campaign_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    subject: text('subject').notNull(),
    preheader: text('preheader'),
    /** Sanitized with the newsletter allowlist, narrower than the site's general rich text. */
    introHtml: text('intro_html'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => newsletterCampaigns.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.campaignId),
    check('newsletter_campaign_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_newsletter_campaign_translations_campaign_id').on(table.campaignId),
  ]
)

export const newsletterCampaignItems = pgTable(
  'newsletter_campaign_items',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => newsletterCampaigns.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    itemType: text('item_type').notNull(),
    /**
     * Polymorphic reference with no FK, deliberately — same call as `area_reports.area_id`: the
     * referenced piece may be deleted and a sent campaign must survive on its snapshot. Existence
     * is checked when the send is requested, not by the database.
     */
    itemId: text('item_id').notNull(),
    /** Null while the campaign is a draft; frozen when the send is requested. */
    snapshot: jsonb('snapshot').$type<NewsletterCampaignItemSnapshot>(),
    clickCount: integer('click_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    unique('newsletter_campaign_items_campaign_item_unique').on(
      table.campaignId,
      table.itemType,
      table.itemId
    ),
    index('idx_newsletter_campaign_items_campaign_position').on(table.campaignId, table.position),
    // Probed on every admin asset cleanup; jsonb `?` cannot use a btree.
    index('idx_newsletter_campaign_items_asset_paths').using(
      'gin',
      sql`(${table.snapshot} -> 'assetPaths')`
    ),
    check(
      'newsletter_campaign_items_item_type_check',
      sql`${table.itemType} in (${CAMPAIGN_ITEM_TYPE_SQL})`
    ),
    check('newsletter_campaign_items_position_check', sql`${table.position} >= 0`),
  ]
)

export const newsletterCampaignItemTranslations = pgTable(
  'newsletter_campaign_item_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    titleOverride: text('title_override'),
    excerptOverride: text('excerpt_override'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    campaignItemId: text('campaign_item_id')
      .notNull()
      .references(() => newsletterCampaignItems.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.campaignItemId),
    check(
      'newsletter_campaign_item_translations_locale_check',
      buildSupportedLocaleCheck(table.locale)
    ),
    index('idx_newsletter_campaign_item_translations_item_id').on(table.campaignItemId),
  ]
)

/**
 * Deliveries for campaigns. Named apart from `newsletter_deliveries` because that table is still
 * standing during the expand phase; this is the final name, there is no later rename.
 */
export const newsletterCampaignDeliveries = pgTable(
  'newsletter_campaign_deliveries',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    campaignId: text('campaign_id')
      .notNull()
      .references(() => newsletterCampaigns.id, { onDelete: 'cascade' }),
    subscriberId: text('subscriber_id')
      .notNull()
      .references(() => newsletterSubscribers.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true, mode: 'date' }),
    sentAt: timestamp('sent_at', { withTimezone: true, mode: 'date' }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    unique('newsletter_campaign_deliveries_campaign_subscriber_unique').on(
      table.campaignId,
      table.subscriberId
    ),
    index('idx_newsletter_campaign_deliveries_status').on(table.campaignId, table.status),
    index('idx_newsletter_campaign_deliveries_subscriber').on(table.subscriberId),
    check(
      'newsletter_campaign_deliveries_status_check',
      sql`${table.status} in ('queued', 'sending', 'sent', 'failed')`
    ),
  ]
)

// Relations

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({ many }) => ({
  translations: many(newsletterCampaignTranslations),
  items: many(newsletterCampaignItems),
}))

export const newsletterCampaignTranslationsRelations = relations(
  newsletterCampaignTranslations,
  ({ one }) => ({
    campaign: one(newsletterCampaigns, {
      fields: [newsletterCampaignTranslations.campaignId],
      references: [newsletterCampaigns.id],
    }),
  })
)

export const newsletterCampaignItemsRelations = relations(
  newsletterCampaignItems,
  ({ one, many }) => ({
    campaign: one(newsletterCampaigns, {
      fields: [newsletterCampaignItems.campaignId],
      references: [newsletterCampaigns.id],
    }),
    translations: many(newsletterCampaignItemTranslations),
  })
)

export const newsletterCampaignItemTranslationsRelations = relations(
  newsletterCampaignItemTranslations,
  ({ one }) => ({
    campaignItem: one(newsletterCampaignItems, {
      fields: [newsletterCampaignItemTranslations.campaignItemId],
      references: [newsletterCampaignItems.id],
    }),
  })
)
