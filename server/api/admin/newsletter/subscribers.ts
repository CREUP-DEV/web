import { defineEventHandler, readBody, createError } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletterSubscribers } from '../../../db/schema'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { updateSubscriberSchema, validateBody } from '../../../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
  createNewsletterUnsubscribeToken,
} from '../../../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db
      .select()
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.subscribedAt))

    return { items }
  }

  if (event.method === 'POST') {
    const body = await readBody(event)

    try {
      const validated = validateBody(updateSubscriberSchema, body)
      const email = validated.email.trim().toLowerCase()

      const existing = await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
      })

      if (existing) {
        throw createError({
          statusCode: 409,
          message: 'Este correo ya está registrado',
        })
      }

      const [item] = await db
        .insert(newsletterSubscribers)
        .values({
          email,
          active: validated.active,
          ageConfirmed: true,
          confirmToken: null,
          confirmTokenExpiresAt: null,
          confirmedAt: validated.active ? new Date() : null,
          consentSource: NEWSLETTER_CONSENT_SOURCES.adminManual,
          consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
          unsubscribeToken: createNewsletterUnsubscribeToken(),
        })
        .returning()

      return { item }
    } catch (e) {
      throwAdminMutationError('admin.newsletter-subscribers.create', e, event)
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
