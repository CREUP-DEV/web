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
    where: eq(newsletterSubscribers.unsubscribeToken, token),
  })

  if (subscriber && subscriber.active) {
    await db
      .update(newsletterSubscribers)
      .set({
        active: false,
        confirmToken: null,
        confirmTokenExpiresAt: null,
        consentIp: null,
        consentUserAgent: null,
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, subscriber.id))
  }

  // Redirect to the newsletter page regardless (don't reveal if token was valid)
  return sendRedirect(event, `${redirectBasePath}?unsubscribed=1`, 302)
})
