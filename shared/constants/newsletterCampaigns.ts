/**
 * Newsletter campaigns — a campaign is one email built from a selection of already-published
 * content (press articles, activity entries, area reports). Replaces the PDF-edition model.
 */

export const NEWSLETTER_CAMPAIGN_STATUSES = [
  'draft',
  'queued',
  'sending',
  'sent',
  'paused',
  'failed',
] as const

export type NewsletterCampaignStatus = (typeof NEWSLETTER_CAMPAIGN_STATUSES)[number]

/** Statuses that hold a delivery worker token. Mirrored by a DB CHECK on the campaigns table. */
export const NEWSLETTER_CAMPAIGN_ACTIVE_STATUSES = ['queued', 'sending'] as const

/** Statuses a campaign can be resumed from, each with a different body (see the resume endpoint). */
export const NEWSLETTER_CAMPAIGN_RESUMABLE_STATUSES = ['paused', 'failed'] as const

export const NEWSLETTER_CAMPAIGN_ITEM_TYPES = ['press', 'activity', 'area_report'] as const

export type NewsletterCampaignItemType = (typeof NEWSLETTER_CAMPAIGN_ITEM_TYPES)[number]

/**
 * Lock acquisition order when freezing a snapshot. Three different tables are locked, so ordering
 * by id alone does not define a global order — the type comes first and this array fixes it.
 */
export const NEWSLETTER_CAMPAIGN_ITEM_LOCK_ORDER = NEWSLETTER_CAMPAIGN_ITEM_TYPES

/** Section order in the rendered email, independent of per-item position. */
export const NEWSLETTER_CAMPAIGN_SECTION_ORDER = NEWSLETTER_CAMPAIGN_ITEM_TYPES

/** Substituted per recipient by the mailer. Must survive HTML attribute escaping. */
export const NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER = '{{UNSUBSCRIBE_URL}}'

/**
 * Gmail clips messages past ~102KB, which hides the footer holding the unsubscribe link. The hard
 * limit leaves room below that; the soft item count only drives an editor warning.
 */
export const NEWSLETTER_CAMPAIGN_MAX_HTML_BYTES = 90_000
export const NEWSLETTER_CAMPAIGN_ITEM_COUNT_WARNING = 20

/** Image width used in the email body, in px. Matches the 640px layout minus its padding. */
export const NEWSLETTER_CAMPAIGN_IMAGE_WIDTH = 560

export const NEWSLETTER_CAMPAIGN_SUBJECT_MAX_LENGTH = 200
export const NEWSLETTER_CAMPAIGN_PREHEADER_MAX_LENGTH = 200
export const NEWSLETTER_CAMPAIGN_ITEM_TITLE_MAX_LENGTH = 200
export const NEWSLETTER_CAMPAIGN_ITEM_EXCERPT_MAX_LENGTH = 400

/** Characters kept when deriving an area-report excerpt from its rich text. */
export const NEWSLETTER_CAMPAIGN_DERIVED_EXCERPT_LENGTH = 200

/** Click-tracking redirect. `l` carries the locale code the recipient's email was rendered in. */
export const NEWSLETTER_CLICK_BASE_PATH = '/nl/c'

export const buildNewsletterClickPath = (campaignId: string, itemId: string, locale: string) =>
  `${NEWSLETTER_CLICK_BASE_PATH}/${campaignId}/${itemId}?l=${encodeURIComponent(locale)}`
