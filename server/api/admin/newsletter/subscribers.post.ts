import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletterSubscribers } from '../../../db/schema'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { updateSubscriberSchema, validateBody } from '../../../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../../../utils/newsletterSubscribers'

function buildAdminSubscriberUpdateValues(
  existing: typeof newsletterSubscribers.$inferSelect | null,
  email: string,
  active: boolean
) {
  const now = new Date()

  if (active) {
    const isReactivation = !existing || !existing.active

    return {
      active: true,
      ageConfirmed: true,
      confirmedAt: isReactivation ? now : (existing?.confirmedAt ?? now),
      consentIp: isReactivation ? null : existing?.consentIp,
      consentSource: isReactivation
        ? NEWSLETTER_CONSENT_SOURCES.adminManual
        : existing?.consentSource,
      consentTextVersion: isReactivation
        ? NEWSLETTER_CONSENT_TEXT_VERSION
        : existing?.consentTextVersion,
      consentUserAgent: isReactivation ? null : existing?.consentUserAgent,
      email,
      confirmToken: null,
      confirmTokenExpiresAt: null,
      subscribedAt: isReactivation ? now : (existing?.subscribedAt ?? now),
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
    unsubscribedAt: existing?.active ? now : (existing?.unsubscribedAt ?? now),
    unsubscribeToken: null,
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const validated = validateBody(updateSubscriberSchema, body)
    const email = validated.email.trim().toLowerCase()

    const [item] = await db.transaction(async (tx) => {
      const existing = await tx.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
      })

      if (existing) {
        const [updated] = await tx
          .update(newsletterSubscribers)
          .set(buildAdminSubscriberUpdateValues(existing, email, validated.active))
          .where(eq(newsletterSubscribers.id, existing.id))
          .returning()

        if (!updated) {
          throw createError({
            statusCode: 500,
            message: 'No se pudo guardar el suscriptor',
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
      }

      const [created] = await tx
        .insert(newsletterSubscribers)
        .values({
          ...buildAdminSubscriberUpdateValues(null, email, validated.active),
          ageConfirmed: true,
        })
        .returning()

      if (!created) {
        throw createError({
          statusCode: 500,
          message: 'No se pudo guardar el suscriptor',
        })
      }

      await recordNewsletterSubscriptionEvent(
        {
          email,
          eventSource: NEWSLETTER_CONSENT_SOURCES.adminManual,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.adminCreated,
          subscriberId: created.id,
        },
        tx
      )

      return [created]
    })

    return { data: item, item }
  } catch (e) {
    throwAdminMutationError('admin.newsletter-subscribers.create', e, event)
  }
})
