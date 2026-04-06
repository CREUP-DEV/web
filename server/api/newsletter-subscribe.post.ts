import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { newsletterSubscribeSchema, validateBody } from '../utils/validation'
import { enforceRateLimit } from '../utils/rateLimit'
import {
  createConfirmTokenExpiresAt,
  createNewsletterConfirmToken,
  createNewsletterUnsubscribeToken,
  getNewsletterConsentEvidence,
  sendNewsletterConfirmationEmail,
} from '../utils/newsletterSubscribers'
import { pickLocalizedValue } from '~~/shared/utils/locale'

const messagesByLocale = {
  es: {
    rateLimited: 'Has enviado demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    subscriptionFailed: 'No se pudo completar la suscripción en este momento',
    invalidData: 'Datos de suscripción no válidos',
  },
  en: {
    rateLimited: 'Too many requests. Please try again later.',
    subscriptionFailed: 'The subscription could not be completed right now',
    invalidData: 'Invalid subscription data',
  },
}

export default defineEventHandler(async (event) => {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es

  await enforceRateLimit(event, {
    namespace: 'newsletter-subscribe',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    errorMessage: messages.rateLimited,
  })

  try {
    const raw = await readBody(event)
    const body = validateBody(newsletterSubscribeSchema, raw)

    // Honeypot: if filled, it is very likely a bot. Return success silently.
    if (body.website && body.website.trim() !== '') {
      return { success: true }
    }

    const email = body.email.trim().toLowerCase()
    const confirmToken = createNewsletterConfirmToken()
    const confirmTokenExpiresAt = createConfirmTokenExpiresAt()
    const consentEvidence = getNewsletterConsentEvidence(event)

    // Check if already subscribed
    const existing = await db.query.newsletterSubscribers.findFirst({
      where: eq(newsletterSubscribers.email, email),
    })

    if (existing) {
      if (!existing.active) {
        await db
          .update(newsletterSubscribers)
          .set({
            active: false,
            confirmToken,
            confirmTokenExpiresAt,
            confirmedAt: null,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            unsubscribeToken: createNewsletterUnsubscribeToken(),
            ...consentEvidence,
          })
          .where(eq(newsletterSubscribers.id, existing.id))

        await sendNewsletterConfirmationEmail(email, confirmToken, messages.subscriptionFailed)
      }

      // Either way, return success (don't reveal subscription status)
      return { success: true }
    }

    await db.insert(newsletterSubscribers).values({
      email,
      active: false,
      confirmToken,
      confirmTokenExpiresAt,
      unsubscribeToken: createNewsletterUnsubscribeToken(),
      ...consentEvidence,
    })

    await sendNewsletterConfirmationEmail(email, confirmToken, messages.subscriptionFailed)

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
          message: messages.invalidData,
        })
      }

      if (error.statusCode >= 500) {
        throw createError({
          statusCode: 500,
          message: messages.subscriptionFailed,
        })
      }

      throw error
    }

    throw createError({
      statusCode: 500,
      message: messages.subscriptionFailed,
    })
  }
})
