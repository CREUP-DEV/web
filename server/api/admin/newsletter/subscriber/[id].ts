/**
 * Admin Newsletter Subscriber by ID
 * PUT    /api/admin/newsletter/subscriber/:id — Update subscriber (toggle active, change email)
 * DELETE /api/admin/newsletter/subscriber/:id — Delete subscriber permanently
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { newsletterSubscribers } from '../../../../db/schema'
import { requireAuth } from '../../../../utils/requireAuth'
import { updateSubscriberSchema, validateBody } from '../../../../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
} from '../../../../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

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
          consentIp: validated.active ? undefined : null,
          consentUserAgent: validated.active ? undefined : null,
          unsubscribedAt: validated.active ? null : new Date(),
        })
        .where(eq(newsletterSubscribers.id, id))

      const item = await db.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.id, id),
      })

      return { item }
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e) throw e
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE — remove permanently
  if (event.method === 'DELETE') {
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id))
    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
