import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { newsletterSubscribers } from '../../db/schema'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  parseNewsletterConfirmToken,
  parseNewsletterUnsubscribeToken,
  recordNewsletterSubscriptionEvent,
} from './newsletterSubscribers'

export type NewsletterConfirmStatus = 'confirmed' | 'already-confirmed' | 'expired' | 'invalid'
export type NewsletterUnsubscribeStatus = 'unsubscribed' | 'invalid'

export interface NewsletterConfirmActionResult {
  status: NewsletterConfirmStatus
  success: boolean
}

export interface NewsletterUnsubscribeActionResult {
  status: NewsletterUnsubscribeStatus
  success: boolean
}

export async function performNewsletterConfirmAction(
  token: string,
  now: Date = new Date()
): Promise<NewsletterConfirmActionResult> {
  const parsedToken = parseNewsletterConfirmToken(token)
  const subscriber = parsedToken
    ? await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.id, parsedToken.subscriberId),
      })
    : await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.confirmToken, token),
      })

  if (!subscriber) {
    return { status: 'invalid', success: false }
  }

  if (subscriber.active) {
    return { status: 'already-confirmed', success: true }
  }

  if (!subscriber.confirmTokenExpiresAt || subscriber.confirmTokenExpiresAt <= now) {
    return { status: 'expired', success: false }
  }

  if (
    parsedToken &&
    subscriber.confirmTokenExpiresAt.getTime() !== parsedToken.expiresAt.getTime()
  ) {
    return { status: 'expired', success: false }
  }

  const wasConfirmed = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(newsletterSubscribers)
      .set({
        active: true,
        confirmToken: null,
        confirmTokenExpiresAt: null,
        confirmedAt: subscriber.confirmedAt ?? now,
        unsubscribedAt: null,
      })
      .where(
        and(eq(newsletterSubscribers.id, subscriber.id), eq(newsletterSubscribers.active, false))
      )
      .returning({ id: newsletterSubscribers.id })

    if (!updated) {
      return false
    }

    await recordNewsletterSubscriptionEvent(
      {
        email: subscriber.email,
        eventSource: NEWSLETTER_CONSENT_SOURCES.emailLink,
        eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.confirmed,
        subscriberId: subscriber.id,
      },
      tx
    )

    return true
  })

  if (!wasConfirmed) {
    return { status: 'already-confirmed', success: true }
  }

  return { status: 'confirmed', success: true }
}

export async function performNewsletterUnsubscribeAction(
  token: string
): Promise<NewsletterUnsubscribeActionResult> {
  const parsedToken = parseNewsletterUnsubscribeToken(token)
  const subscriber = parsedToken
    ? await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.id, parsedToken.subscriberId),
      })
    : await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.unsubscribeToken, token),
      })

  if (
    subscriber &&
    (!parsedToken || subscriber.subscribedAt.getTime() === parsedToken.subscribedAt.getTime())
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(newsletterSubscribers)
        .set({
          active: false,
          confirmToken: null,
          confirmTokenExpiresAt: null,
          unsubscribedAt: new Date(),
          unsubscribeToken: null,
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

    return { status: 'unsubscribed', success: true }
  }

  return { status: 'invalid', success: false }
}
