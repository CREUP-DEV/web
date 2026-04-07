import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { newsletterSubscribeSchema, validateBody } from '../utils/validation'
import { enforceRateLimit } from '../utils/rateLimit'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  createConfirmTokenExpiresAt,
  createNewsletterConfirmToken,
  createNewsletterUnsubscribeToken,
  getNewsletterConsentEvidence,
  recordNewsletterSubscriptionEvent,
  sendNewsletterConfirmationEmail,
} from '../utils/newsletterSubscribers'

export default defineEventHandler(async (event) => {
  const { locale } = getRequestLocaleContext(event)
  const newsletterRateLimitedMessage = getPublicApiErrorMessage(event, 'newsletterRateLimited')
  const newsletterSubscriptionFailedMessage = getPublicApiErrorMessage(
    event,
    'newsletterSubscriptionFailed'
  )
  const newsletterEmailDeliveryFailedMessage = getPublicApiErrorMessage(
    event,
    'newsletterEmailDeliveryFailed'
  )
  const newsletterInvalidDataMessage = getPublicApiErrorMessage(event, 'newsletterInvalidData')

  enforceRateLimit(event, {
    namespace: 'newsletter-subscribe',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    errorMessage: newsletterRateLimitedMessage,
  })

  try {
    const raw = await readBody(event)
    const body = validateBody(newsletterSubscribeSchema, raw)

    if (body.website && body.website.trim() !== '') {
      return { success: true }
    }

    const email = body.email.trim().toLowerCase()
    const confirmToken = createNewsletterConfirmToken()
    const confirmTokenExpiresAt = createConfirmTokenExpiresAt()
    const consentEvidence = getNewsletterConsentEvidence(event)

    await db.transaction(async (tx) => {
      const existing = await tx.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
      })

      if (existing && existing.active) {
        return
      }

      if (existing) {
        const [item] = await tx
          .update(newsletterSubscribers)
          .set({
            active: false,
            ageConfirmed: true,
            confirmToken,
            confirmTokenExpiresAt,
            confirmedAt: null,
            consentIp: consentEvidence.consentIp,
            consentSource: NEWSLETTER_CONSENT_SOURCES.webForm,
            consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
            consentUserAgent: consentEvidence.consentUserAgent,
            locale,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            unsubscribeToken: createNewsletterUnsubscribeToken(),
          })
          .where(eq(newsletterSubscribers.id, existing.id))
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: newsletterSubscriptionFailedMessage,
          })
        }

        await recordNewsletterSubscriptionEvent(
          {
            email,
            eventSource: NEWSLETTER_CONSENT_SOURCES.webForm,
            eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.requested,
            subscriberId: item.id,
          },
          tx
        )
      } else {
        const [item] = await tx
          .insert(newsletterSubscribers)
          .values({
            ...consentEvidence,
            active: false,
            ageConfirmed: true,
            confirmToken,
            confirmTokenExpiresAt,
            confirmedAt: null,
            consentSource: NEWSLETTER_CONSENT_SOURCES.webForm,
            consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
            email,
            locale,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            unsubscribeToken: createNewsletterUnsubscribeToken(),
          })
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: newsletterSubscriptionFailedMessage,
          })
        }

        await recordNewsletterSubscriptionEvent(
          {
            email,
            eventSource: NEWSLETTER_CONSENT_SOURCES.webForm,
            eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.requested,
            subscriberId: item.id,
          },
          tx
        )
      }

      try {
        await sendNewsletterConfirmationEmail(
          email,
          confirmToken,
          locale,
          newsletterSubscriptionFailedMessage
        )
      } catch {
        throw createError({
          statusCode: 503,
          message: newsletterEmailDeliveryFailedMessage,
        })
      }
    })

    return { success: true }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
    ) {
      if (error.statusCode === 400) {
        throw createError({
          statusCode: 400,
          message: newsletterInvalidDataMessage,
        })
      }

      if (error.statusCode === 503) {
        throw createError({
          statusCode: 503,
          message: newsletterEmailDeliveryFailedMessage,
        })
      }

      if (error.statusCode >= 500) {
        throw createError({
          statusCode: 500,
          message: newsletterSubscriptionFailedMessage,
        })
      }

      throw error
    }

    throw createError({
      statusCode: 500,
      message: newsletterSubscriptionFailedMessage,
    })
  }
})
