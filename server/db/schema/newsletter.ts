import { pgTable, text, boolean, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'

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
