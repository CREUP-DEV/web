import { defineEventHandler, readBody, setHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { buildLocalizedPath } from '../utils/urlBuilder'
import { newsletterTokenQuerySchema, validateBody } from '../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const { token } = validateBody(newsletterTokenQuerySchema, await readBody(event))
  const redirectPath = buildLocalizedPath(event, '/prensa/newsletter')
  const now = new Date()

  const subscriber = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.confirmToken, token),
  })

  if (subscriber && (!subscriber.confirmTokenExpiresAt || subscriber.confirmTokenExpiresAt > now)) {
    await db.transaction(async (tx) => {
      await tx
        .update(newsletterSubscribers)
        .set({
          active: true,
          confirmToken: null,
          confirmTokenExpiresAt: null,
          confirmedAt: subscriber.confirmedAt ?? now,
          unsubscribedAt: null,
        })
        .where(eq(newsletterSubscribers.id, subscriber.id))

      await recordNewsletterSubscriptionEvent(
        {
          email: subscriber.email,
          eventSource: NEWSLETTER_CONSENT_SOURCES.emailLink,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.confirmed,
          subscriberId: subscriber.id,
        },
        tx
      )
    })

    return { success: true, redirectTo: `${redirectPath}?confirmed=1` }
  }

  if (subscriber) {
    await db.transaction(async (tx) => {
      await tx
        .update(newsletterSubscribers)
        .set({
          confirmToken: null,
          confirmTokenExpiresAt: null,
        })
        .where(eq(newsletterSubscribers.id, subscriber.id))

      await recordNewsletterSubscriptionEvent(
        {
          email: subscriber.email,
          eventSource: NEWSLETTER_CONSENT_SOURCES.emailLink,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.confirmationExpired,
          subscriberId: subscriber.id,
        },
        tx
      )
    })
  }

  return { success: false, redirectTo: `${redirectPath}?confirmed=expired` }
})
