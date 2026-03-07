import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3'
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
    where: eq(newsletterSubscribers.confirmToken, token),
  })

  if (subscriber) {
    await db
      .update(newsletterSubscribers)
      .set({
        active: true,
        confirmToken: null,
        confirmedAt: subscriber.confirmedAt ?? new Date(),
        unsubscribedAt: null,
      })
      .where(eq(newsletterSubscribers.id, subscriber.id))
  }

  return sendRedirect(event, '/prensa/newsletter?confirmed=1', 302)
})
