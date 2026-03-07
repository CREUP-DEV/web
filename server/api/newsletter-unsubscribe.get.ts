/**
 * GET /api/newsletter-unsubscribe?token=xxx
 * Public endpoint — unsubscribe from newsletter via one-click link.
 */
import { defineEventHandler, getQuery, createError, sendRedirect } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string | undefined

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token requerido' })
  }

  const subscriber = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.unsubscribeToken, token),
  })

  if (subscriber && subscriber.active) {
    await db
      .update(newsletterSubscribers)
      .set({
        active: false,
        confirmToken: null,
        consentIp: null,
        consentUserAgent: null,
        unsubscribedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, subscriber.id))
  }

  // Redirect to the newsletter page regardless (don't reveal if token was valid)
  return sendRedirect(event, '/prensa/newsletter?unsubscribed=1', 302)
})
