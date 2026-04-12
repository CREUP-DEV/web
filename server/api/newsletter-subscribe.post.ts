import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { validatePublicBody } from '../utils/validation'
import { enforceRateLimit } from '../utils/rateLimit'
import { newsletterSubscribeSchema } from '~~/shared/utils/newsletterValidation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  createConfirmTokenExpiresAt,
  getNewsletterConsentEvidence,
  recordNewsletterSubscriptionEvent,
  sendNewsletterAlreadySubscribedEmail,
  sendNewsletterConfirmationEmail,
} from '../utils/newsletterSubscribers'
import { hasMinimumPublicFormSubmitDelay, verifyTurnstileTokenOrThrow } from '../utils/turnstile'
import { throwSafePublicError } from '../utils/publicErrors'

export default defineEventHandler(async (event) => {
  const { locale, locales, defaultLocale } = getRequestLocaleContext(event)
  const newsletterRateLimitedMessage = getPublicApiErrorMessage(event, 'newsletterRateLimited')
  const newsletterSubscriptionFailedMessage = getPublicApiErrorMessage(
    event,
    'newsletterSubscriptionFailed'
  )
  const newsletterEmailDeliveryFailedMessage = getPublicApiErrorMessage(
    event,
    'newsletterEmailDeliveryFailed'
  )
  const invalidInputMessage = getPublicApiErrorMessage(event, 'invalidInput')
  const newsletterInvalidDataMessage = getPublicApiErrorMessage(event, 'newsletterInvalidData')
  const antiSpamValidationFailedMessage = getPublicApiErrorMessage(
    event,
    'antiSpamValidationFailed'
  )

  await enforceRateLimit(event, {
    namespace: 'newsletter-subscribe',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    errorMessage: newsletterRateLimitedMessage,
  })

  try {
    const raw = await readBody(event)
    const body = validatePublicBody(event, newsletterSubscribeSchema, raw)

    if (body.middleName && body.middleName.trim() !== '') {
      return { success: true }
    }

    if (!hasMinimumPublicFormSubmitDelay(body.startedAt)) {
      throw createError({
        statusCode: 400,
        message: antiSpamValidationFailedMessage,
      })
    }

    await verifyTurnstileTokenOrThrow(event, body.turnstileToken, {
      invalidMessage: getPublicApiErrorMessage(event, 'turnstileValidationFailed'),
      unavailableMessage: getPublicApiErrorMessage(event, 'turnstileUnavailable'),
    })

    const email = body.email.trim().toLowerCase()
    const confirmTokenExpiresAt = createConfirmTokenExpiresAt()
    const consentEvidence = getNewsletterConsentEvidence(event)

    // Track what email to send after the transaction completes.
    // This keeps the DB transaction short and avoids sending emails
    // that get rolled back if the transaction fails.
    let pendingEmailType: 'confirmation' | 'already_subscribed' | null = null
    let pendingSubscriberId: string | null = null
    let pendingSubscriberSubscribedAt: Date | null = null

    await db.transaction(async (tx) => {
      const existing = await tx.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
      })

      if (existing && existing.active) {
        pendingEmailType = 'already_subscribed'
        pendingSubscriberId = existing.id
        pendingSubscriberSubscribedAt = existing.subscribedAt
        return
      }

      if (existing) {
        const [item] = await tx
          .update(newsletterSubscribers)
          .set({
            active: false,
            ageConfirmed: true,
            confirmTokenExpiresAt,
            confirmedAt: existing.confirmedAt ?? null,
            consentIp: consentEvidence.consentIp,
            consentSource: NEWSLETTER_CONSENT_SOURCES.webForm,
            consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
            consentUserAgent: consentEvidence.consentUserAgent,
            locale,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            unsubscribeToken: null,
          })
          .where(eq(newsletterSubscribers.id, existing.id))
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: newsletterSubscriptionFailedMessage,
          })
        }

        pendingSubscriberId = item.id

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
            confirmTokenExpiresAt,
            confirmedAt: null,
            consentSource: NEWSLETTER_CONSENT_SOURCES.webForm,
            consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
            email,
            locale,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            unsubscribeToken: null,
          })
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: newsletterSubscriptionFailedMessage,
          })
        }

        pendingSubscriberId = item.id

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

      pendingEmailType = 'confirmation'
    })

    // Send email after transaction is committed to avoid sending emails
    // for changes that may later be rolled back.
    if (pendingEmailType === 'confirmation' && pendingSubscriberId) {
      try {
        await sendNewsletterConfirmationEmail(
          email,
          pendingSubscriberId,
          confirmTokenExpiresAt,
          locale,
          locales,
          defaultLocale,
          newsletterSubscriptionFailedMessage
        )
      } catch {
        throw createError({
          statusCode: 503,
          message: newsletterEmailDeliveryFailedMessage,
        })
      }
    } else if (pendingEmailType === 'already_subscribed') {
      // Best-effort: don't fail the request if this secondary email errors
      if (pendingSubscriberId && pendingSubscriberSubscribedAt) {
        sendNewsletterAlreadySubscribedEmail(
          email,
          pendingSubscriberId,
          pendingSubscriberSubscribedAt,
          newsletterSubscriptionFailedMessage
        ).catch(() => {})
      }
    }

    return { success: true }
  } catch (error) {
    // Hide Zod validation details from public callers.
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      'message' in error &&
      (error as { statusCode: unknown }).statusCode === 400 &&
      (error as { message: unknown }).message === invalidInputMessage
    ) {
      throw createError({ statusCode: 400, message: newsletterInvalidDataMessage })
    }

    throwSafePublicError(event, 'public.newsletter-subscribe.unexpected-error', error)
  }
})
