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
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../../../../utils/newsletterSubscribers'

function buildSubscriberUpdateValues(
  existing: typeof newsletterSubscribers.$inferSelect,
  email: string,
  active: boolean
) {
  const now = new Date()

  if (active) {
    const isReactivation = !existing.active

    return {
      active: true,
      ageConfirmed: true,
      confirmedAt: isReactivation ? now : (existing.confirmedAt ?? now),
      consentIp: isReactivation ? null : existing.consentIp,
      consentSource: isReactivation
        ? NEWSLETTER_CONSENT_SOURCES.adminManual
        : existing.consentSource,
      consentTextVersion: isReactivation
        ? NEWSLETTER_CONSENT_TEXT_VERSION
        : existing.consentTextVersion,
      consentUserAgent: isReactivation ? null : existing.consentUserAgent,
      email,
      confirmToken: null,
      confirmTokenExpiresAt: null,
      subscribedAt: isReactivation ? now : existing.subscribedAt,
      unsubscribedAt: null,
      unsubscribeToken: null,
    }
  }

  return {
    active: false,
    ageConfirmed: true,
    email,
    confirmToken: null,
    confirmTokenExpiresAt: null,
    consentIp: null,
    consentSource: NEWSLETTER_CONSENT_SOURCES.adminManual,
    consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
    consentUserAgent: null,
    unsubscribedAt: existing.active ? now : (existing.unsubscribedAt ?? now),
    unsubscribeToken: null,
  }
}

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)

  try {
    const validated = validateBody(updateSubscriberSchema, body)
    const email = validated.email.trim().toLowerCase()

    const [item] = await db.transaction(async (tx) => {
      const existing = await tx.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.id, id),
      })

      if (!existing) {
        throw createError({ statusCode: 404, message: 'No encontrado' })
      }

      const emailInUse = await tx.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
      })

      if (emailInUse && emailInUse.id !== id) {
        throw createError({
          statusCode: 409,
          message: 'Este correo ya está registrado',
        })
      }

      const [updated] = await tx
        .update(newsletterSubscribers)
        .set(buildSubscriberUpdateValues(existing, email, validated.active))
        .where(eq(newsletterSubscribers.id, id))
        .returning()

      if (!updated) {
        throw createError({
          statusCode: 500,
          message: 'No se pudo actualizar el suscriptor',
        })
      }

      await recordNewsletterSubscriptionEvent(
        {
          email,
          eventSource: NEWSLETTER_CONSENT_SOURCES.adminManual,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.adminUpdated,
          subscriberId: updated.id,
        },
        tx
      )

      return [updated]
    })

    return { item }
  } catch (e) {
    throwAdminMutationError('admin.newsletter-subscriber.update', e, event)
  }
})
