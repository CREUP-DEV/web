/**
 * Admin Newsletter Subscribers
 * GET  /api/admin/newsletter/subscribers       — List all subscribers
 * POST /api/admin/newsletter/subscribers       — Add subscriber manually
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletterSubscribers } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateSubscriberSchema, validateBody } from '../../../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
} from '../../../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

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

      // Check if already exists
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
          confirmedAt: validated.active ? new Date() : null,
          consentSource: NEWSLETTER_CONSENT_SOURCES.adminManual,
          consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
        })
        .returning()

      return { item }
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e) throw e
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
