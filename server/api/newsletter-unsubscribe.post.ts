import { defineEventHandler, readBody, setHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { buildLocalizedPath } from '../utils/urlBuilder'
import { newsletterTokenQuerySchema, validateBody } from '../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  createNewsletterUnsubscribeToken,
  recordNewsletterSubscriptionEvent,
} from '../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const { token } = validateBody(newsletterTokenQuerySchema, await readBody(event))
  const redirectPath = buildLocalizedPath(event, '/prensa/newsletter')

  const subscriber = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.unsubscribeToken, token),
  })

  if (subscriber) {
    await db.transaction(async (tx) => {
      await tx
        .update(newsletterSubscribers)
        .set({
          active: false,
          confirmToken: null,
          confirmTokenExpiresAt: null,
          unsubscribedAt: new Date(),
          unsubscribeToken: createNewsletterUnsubscribeToken(),
        })
        .where(eq(newsletterSubscribers.id, subscriber.id))

      await recordNewsletterSubscriptionEvent(
        {
          email: subscriber.email,
          eventSource: NEWSLETTER_CONSENT_SOURCES.emailLink,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.unsubscribed,
          subscriberId: subscriber.id,
        },
        tx
      )
    })

    return { success: true, redirectTo: `${redirectPath}?unsubscribed=1` }
  }

  return { success: false, redirectTo: `${redirectPath}?unsubscribed=invalid` }
})
