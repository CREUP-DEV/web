import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { validateBody } from '../utils/validation'
import { enforceRateLimit } from '../utils/rateLimit'
import { newsletterSubscribeSchema } from '~~/shared/utils/newsletterValidation'
import {
  NEWSLETTER_CONSENT_SOURCES,
  NEWSLETTER_CONSENT_TEXT_VERSION,
  NEWSLETTER_SUBSCRIPTION_EVENT_TYPES,
  createConfirmTokenExpiresAt,
  createNewsletterConfirmToken,
  createNewsletterUnsubscribeToken,
  getNewsletterConsentEvidence,
  recordNewsletterSubscriptionEvent,
  sendNewsletterAlreadySubscribedEmail,
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

    // Track what email to send after the transaction completes.
    // This keeps the DB transaction short and avoids sending emails
    // that get rolled back if the transaction fails.
    let pendingEmailType: 'confirmation' | 'already_subscribed' | null = null

    await db.transaction(async (tx) => {
      const existing = await tx.query.newsletterSubscribers.findFirst({
        where: eq(newsletterSubscribers.email, email),
      })

      if (existing && existing.active) {
        pendingEmailType = 'already_subscribed'
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

      pendingEmailType = 'confirmation'
    })

    // Send email after transaction is committed to avoid sending emails
    // for changes that may later be rolled back.
    if (pendingEmailType === 'confirmation') {
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
    } else if (pendingEmailType === 'already_subscribed') {
      // Best-effort: don't fail the request if this secondary email errors
      sendNewsletterAlreadySubscribedEmail(email, newsletterSubscriptionFailedMessage).catch(
        () => {}
      )
    }

    return { success: true }
  } catch (error) {
    // Hide Zod validation details from public callers; re-throw all other errors as-is
    // (errors thrown inside this handler already carry the correct status and message).
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as { statusCode: unknown }).statusCode === 400
    ) {
      throw createError({ statusCode: 400, message: newsletterInvalidDataMessage })
    }

    throw error
  }
})
