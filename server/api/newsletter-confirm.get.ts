import { defineEventHandler, sendRedirect, setHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { buildLocalizedPath } from '../utils/urlBuilder'
import { newsletterTokenQuerySchema, validateQuery } from '../utils/validation'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')

  const { token } = validateQuery(event, newsletterTokenQuerySchema)
  const redirectBasePath = buildLocalizedPath(event, '/prensa/newsletter')

  const subscriber = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.confirmToken, token),
  })

  const now = new Date()

  if (subscriber && (!subscriber.confirmTokenExpiresAt || subscriber.confirmTokenExpiresAt > now)) {
    await db
      .update(newsletterSubscribers)
      .set({
        active: true,
        confirmToken: null,
        confirmTokenExpiresAt: null,
        confirmedAt: subscriber.confirmedAt ?? now,
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, subscriber.id))

    return sendRedirect(event, `${redirectBasePath}?confirmed=1`, 302)
  }

  if (subscriber) {
    await db
      .update(newsletterSubscribers)
      .set({
        confirmToken: null,
        confirmTokenExpiresAt: null,
      })
      .where(eq(newsletterSubscribers.id, subscriber.id))
  }

  return sendRedirect(event, `${redirectBasePath}?confirmed=expired`, 302)
})
