/**
 * Delivery constants that describe the worker protocol rather than any one table, kept apart so
 * they outlived the PDF-era pipeline they were first written for.
 */

/** Per-recipient delivery states, shared by every campaign delivery row. */
export const NEWSLETTER_DELIVERY_STATUS = {
  queued: 'queued',
  sending: 'sending',
  sent: 'sent',
  failed: 'failed',
} as const

export type NewsletterDeliveryStatus =
  (typeof NEWSLETTER_DELIVERY_STATUS)[keyof typeof NEWSLETTER_DELIVERY_STATUS]

/** Attempts before a recipient is given up on. */
export const NEWSLETTER_DELIVERY_MAX_ATTEMPTS = 3

/**
 * A worker heartbeats on every iteration, so silence for this long means it crashed and the lease
 * can be reclaimed.
 */
export const NEWSLETTER_DELIVERY_WORKER_STALE_MS = 2 * 60 * 1000

export function getNewsletterDeliveryStaleBefore() {
  return new Date(Date.now() - NEWSLETTER_DELIVERY_WORKER_STALE_MS)
}
