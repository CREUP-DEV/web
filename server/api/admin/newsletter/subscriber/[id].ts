import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { newsletterSubscribers } from '../../../../db/schema'
import { throwAdminMutationError } from '../../../../utils/adminErrors'
import {
  idRouteParamSchema,
  updateSubscriberSchema,
  validateBody,
  validateRouteParams,
} from '../../../../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
  createNewsletterUnsubscribeToken,
} from '../../../../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  // PUT — update subscriber
  if (event.method === 'PUT') {
    const body = await readBody(event)

    try {
      const validated = validateBody(updateSubscriberSchema, body)

      await db
        .update(newsletterSubscribers)
        .set({
          email: validated.email.trim().toLowerCase(),
          active: validated.active,
          ageConfirmed: validated.active ? true : undefined,
          confirmedAt: validated.active ? new Date() : undefined,
          consentSource: validated.active ? NEWSLETTER_CONSENT_SOURCES.adminManual : undefined,
          consentTextVersion: validated.active ? NEWSLETTER_CONSENT_TEXT_VERSION : undefined,
          confirmToken: validated.active ? null : undefined,
          confirmTokenExpiresAt: validated.active ? null : undefined,
          consentIp: validated.active ? undefined : null,
          consentUserAgent: validated.active ? undefined : null,
          unsubscribeToken: validated.active ? createNewsletterUnsubscribeToken() : undefined,
          unsubscribedAt: validated.active ? null : new Date(),
        })
        .where(eq(newsletterSubscribers.id, id))

      const item = await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.id, id),
      })

      return { item }
    } catch (e) {
      throwAdminMutationError('admin.newsletter-subscriber.update', e, event)
    }
  }

  // DELETE — remove permanently
  if (event.method === 'DELETE') {
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id))
    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
