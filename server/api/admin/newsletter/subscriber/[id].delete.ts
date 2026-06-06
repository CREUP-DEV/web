import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { newsletterSubscribers } from '../../../../db/schema'
import { throwAdminMutationError } from '../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  recordNewsletterSubscriptionEvent,
} from '../../../../utils/newsletter/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  try {
    const existing = await db.query.newsletterSubscribers.findFirst({
      where: eq(newsletterSubscribers.id, id),
    })

    if (!existing) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    await db.transaction(async (tx) => {
      await recordNewsletterSubscriptionEvent(
        {
          email: existing.email,
          eventSource: NEWSLETTER_CONSENT_SOURCES.adminManual,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.adminDeleted,
          subscriberId: existing.id,
        },
        tx
      )

      await tx.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id))
    })

    return { data: { success: true } }
  } catch (e) {
    throwAdminMutationError('admin.newsletter-subscriber.delete', e, event)
  }
})
