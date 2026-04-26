import {
  pgTable,
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
import { sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'

// Newsletters

export const newsletters = pgTable(
  'newsletters',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    /** Stable year-month key (YYYY-MM) used to prevent duplicates */
    monthKey: text('month_key').notNull().unique(),
    /** Month the newsletter covers (stored as first day of month) */
    month: date('month', { mode: 'date' }).notNull(),
    /** Nullable when the edition uses the configured site default newsletter cover image. */
    coverImage: text('cover_image'),
    pdfUrl: text('pdf_url').notNull(),
    /** Controls whether the newsletter is visible in the public archive and sitemap */
    publicVisible: boolean('public_visible').default(false).notNull(),
    /**
     * A non-null worker token signals "delivery in progress."
     * The `sending` boolean was redundant with this token; it has been removed.
     * Use `lastDeliveryWorkerToken IS NOT NULL` to check delivery state.
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
    /** Array of email addresses that failed delivery (stored as JSONB). */
    lastDeliveryFailedRecipients: jsonb('last_delivery_failed_recipients').$type<string[]>(),
    lastDeliveryWorkerToken: text('last_delivery_worker_token'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('idx_newsletters_sent_worker').on(table.sentAt, table.lastDeliveryWorkerToken),
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
    subscribedAt: timestamp('subscribed_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true, mode: 'date' }),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true, mode: 'date' }),
    /**
     * Pending double opt-in confirmation token.
     * New confirmation links are signed and not stored in clear; this column
     * remains for legacy rows that still need to be consumed or expired.
     * UNIQUE so legacy tokens cannot collide.
     */
    confirmToken: text('confirm_token').unique(),
    /** Expiry timestamp for the confirmation token (48h TTL) */
    confirmTokenExpiresAt: timestamp('confirm_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    /**
     * Legacy unsubscribe token column kept for backward compatibility with
     * old email links. New flows use signed tokens and leave this NULL.
     */
    unsubscribeToken: text('unsubscribe_token').unique(),
    /** Minimal evidence to demonstrate the consent request */
    consentIp: text('consent_ip'),
    consentUserAgent: text('consent_user_agent'),
    consentSource: text('consent_source').default('web_form').notNull(),
    consentTextVersion: text('consent_text_version').notNull(),
    ageConfirmed: boolean('age_confirmed').default(false).notNull(),
    locale: text('locale'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('idx_newsletter_subscribers_active_subscribed').on(table.active, table.subscribedAt),
    index('idx_newsletter_subscribers_token_cleanup')
      .on(table.confirmTokenExpiresAt)
      .where(sql`${table.active} = false AND ${table.confirmTokenExpiresAt} IS NOT NULL`),
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
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
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
