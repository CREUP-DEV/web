/**
 * POST /api/newsletter-subscribe
 * Public endpoint — subscribe an email to the newsletter.
 * Includes rate limiting and honeypot spam check.
 */
import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers } from '../db/schema'
import { newsletterSubscribeSchema, validateBody } from '../utils/validation'
import {
  createNewsletterConfirmToken,
  getNewsletterConsentEvidence,
  sendNewsletterConfirmationEmail,
} from '../utils/newsletterSubscribers'

// ---------------------------------------------------------------------------
// In-memory rate limiting (per IP, 5 requests per hour)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>()
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now - record.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now })
    return false
  }

  record.count++
  return record.count > MAX_REQUESTS
}

export default defineEventHandler(async (event) => {
  // Rate-limit by client IP
  const clientIp =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ||
    getHeader(event, 'x-real-ip') ||
    'unknown'

  if (isRateLimited(clientIp)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    })
  }

  try {
    const raw = await readBody(event)
    const body = validateBody(newsletterSubscribeSchema, raw)

    // Honeypot — if filled it's very likely a bot; silently "succeed"
    if (body.website && body.website.trim() !== '') {
      return { success: true }
    }

    const email = body.email.trim().toLowerCase()
    const confirmToken = createNewsletterConfirmToken()
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
            ageConfirmed: true,
            confirmToken,
            confirmedAt: null,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            ...consentEvidence,
          })
          .where(eq(newsletterSubscribers.id, existing.id))

        await sendNewsletterConfirmationEmail(email, confirmToken)
      }

      // Either way, return success (don't reveal subscription status)
      return { pendingConfirmation: !existing.active, success: true }
    }

    await db.insert(newsletterSubscribers).values({
      email,
      active: false,
      ageConfirmed: true,
      confirmToken,
      ...consentEvidence,
    })

    await sendNewsletterConfirmationEmail(email, confirmToken)

    return { pendingConfirmation: true, success: true }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    if (error instanceof Error && error.message === 'SMTP_CONFIG_MISSING') {
      throw createError({
        statusCode: 500,
        message: 'No se pudo completar la suscripción en este momento',
      })
    }

    throw createError({
      statusCode: 400,
      message: 'Datos de suscripción no válidos',
    })
  }
})
