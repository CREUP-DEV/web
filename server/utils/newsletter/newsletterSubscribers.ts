import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, inArray, isNotNull, lte } from 'drizzle-orm'
import { db } from '../../db'
import { newsletterSubscribers, newsletterSubscriptionEvents } from '../../db/schema'
import { logError } from '../core/logger'
import { getRequiredSiteUrl, getRequiredSmtpFromEmail } from '../core/runtimeConfig'
import { buildAbsoluteUrl, getClientIp, getUserAgent, normalizeBaseUrl } from '../core/urlBuilder'
import { ensureSmtpTransporterVerified } from '../email/smtpTransporter'
import { getOptionalConfigString, requireConfigString } from '~~/shared/utils/config'
import { buildLocalizedPathFromLocale, type LocaleDefinition } from '~~/shared/utils/locale'
import {
  buildNewsletterAlreadySubscribedEmailHtml,
  buildNewsletterConfirmationEmailHtml,
} from '../email/emailTemplates'

export const NEWSLETTER_CONSENT_TEXT_VERSION = '2026-03-06'

/** Confirmation tokens expire after 48 hours */
export const NEWSLETTER_CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000
const NEWSLETTER_TOKEN_VERSION = 'v1'
const NEWSLETTER_TOKEN_SEPARATOR = '.'
const NEWSLETTER_TOKEN_KIND_CONFIRM = 'confirm'
const NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE = 'unsubscribe'
/**
 * Campaign attribution is signed in its own domain so a signature from one kind can never be
 * replayed as another. It is not a token — nothing is parsed out of it, it is only checked against
 * values already in hand — which is why it stays out of `createNewsletterToken`.
 */
const NEWSLETTER_TOKEN_KIND_ATTRIBUTION = 'attribution'

export const NEWSLETTER_CONSENT_SOURCES = {
  adminManual: 'admin_manual',
  legacyImport: 'legacy_import',
  emailLink: 'email_link',
  system: 'system',
  webForm: 'web_form',
} as const

export const NEWSLETTER_SUBSCRIPTION_EVENT_TYPES = {
  adminCreated: 'admin_created',
  adminDeleted: 'admin_deleted',
  adminUpdated: 'admin_updated',
  confirmationExpired: 'confirmation_expired',
  confirmed: 'confirmed',
  requested: 'requested',
  unsubscribed: 'unsubscribed',
} as const

export type NewsletterSubscriptionEventType =
  (typeof NEWSLETTER_SUBSCRIPTION_EVENT_TYPES)[keyof typeof NEWSLETTER_SUBSCRIPTION_EVENT_TYPES]

export type NewsletterSubscriptionEventSource =
  (typeof NEWSLETTER_CONSENT_SOURCES)[keyof typeof NEWSLETTER_CONSENT_SOURCES]

export interface NewsletterSubscriptionEventInput {
  email: string
  eventSource: NewsletterSubscriptionEventSource
  eventType: NewsletterSubscriptionEventType
  subscriberId: string
}

export function getNewsletterConsentEvidence(event: H3Event) {
  return {
    ageConfirmed: true,
    consentIp: getClientIp(event),
    consentSource: NEWSLETTER_CONSENT_SOURCES.webForm,
    consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
    consentUserAgent: getUserAgent(event),
  }
}

function getNewsletterTokenSecret() {
  const tokenSecret =
    getOptionalConfigString(process.env.NEWSLETTER_TOKEN_SECRET) ??
    getOptionalConfigString(process.env.APP_SECRET)

  return requireConfigString(tokenSecret, 'NEWSLETTER_TOKEN_SECRET or APP_SECRET')
}

function buildNewsletterTokenSignature(
  kind:
    | typeof NEWSLETTER_TOKEN_KIND_CONFIRM
    | typeof NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE
    | typeof NEWSLETTER_TOKEN_KIND_ATTRIBUTION,
  subscriberId: string,
  extra: string
) {
  return createHmac('sha256', getNewsletterTokenSecret())
    .update(`${NEWSLETTER_TOKEN_VERSION}:${kind}:${subscriberId}:${extra}`)
    .digest('base64url')
}

function createNewsletterToken(
  kind: typeof NEWSLETTER_TOKEN_KIND_CONFIRM | typeof NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE,
  subscriberId: string,
  extra: string
) {
  return [
    NEWSLETTER_TOKEN_VERSION,
    subscriberId,
    extra,
    buildNewsletterTokenSignature(kind, subscriberId, extra),
  ].join(NEWSLETTER_TOKEN_SEPARATOR)
}

function parseSignedNewsletterToken(
  token: string,
  kind: typeof NEWSLETTER_TOKEN_KIND_CONFIRM | typeof NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE
) {
  const parts = token.trim().split(NEWSLETTER_TOKEN_SEPARATOR)

  if (parts.length !== 4) {
    return null
  }

  const [version, subscriberId, extra, signature] = parts
  if (version !== NEWSLETTER_TOKEN_VERSION || !subscriberId || !extra || !signature) {
    return null
  }

  const expectedSignature = buildNewsletterTokenSignature(kind, subscriberId, extra)
  const expectedBuffer = Buffer.from(expectedSignature)
  const signatureBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== signatureBuffer.length) {
    return null
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null
  }

  return { subscriberId, extra }
}

function toSubscriptionStartedAt(subscribedAt: Date | string) {
  const subscriptionStartedAt =
    subscribedAt instanceof Date ? subscribedAt.getTime() : new Date(subscribedAt).getTime()

  if (!Number.isInteger(subscriptionStartedAt) || subscriptionStartedAt <= 0) {
    throw new Error('Invalid newsletter subscription timestamp')
  }

  return subscriptionStartedAt
}

/**
 * Signs "this unsubscribe came from campaign X" without authorising anything: the unsubscribe token
 * remains the only authorisation, and a missing or bad signature only costs the campaign a count.
 *
 * Binding to `subscribedAt` is what stops an old signature riding along with a newer token. Without
 * it: unsubscribe, resubscribe (same row, same id, new `subscribedAt`), then pair the fresh token
 * with the previous campaign's signature and have the new unsubscribe counted against it again.
 */
export function createNewsletterAttributionSignature(
  subscriberId: string,
  campaignId: string,
  subscribedAt: Date | string
) {
  return buildNewsletterTokenSignature(
    NEWSLETTER_TOKEN_KIND_ATTRIBUTION,
    subscriberId,
    `${campaignId}:${toSubscriptionStartedAt(subscribedAt)}`
  )
}

export function verifyNewsletterAttributionSignature(
  signature: string,
  subscriberId: string,
  campaignId: string,
  subscribedAt: Date | string
) {
  let expected: string

  try {
    expected = createNewsletterAttributionSignature(subscriberId, campaignId, subscribedAt)
  } catch {
    return false
  }

  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer)
}

export function createNewsletterConfirmToken(subscriberId: string, expiresAt: Date) {
  return createNewsletterToken(
    NEWSLETTER_TOKEN_KIND_CONFIRM,
    subscriberId,
    String(expiresAt.getTime())
  )
}

export function parseNewsletterConfirmToken(token: string) {
  const parsed = parseSignedNewsletterToken(token, NEWSLETTER_TOKEN_KIND_CONFIRM)

  if (!parsed) {
    return null
  }

  const expiresAtMs = Number(parsed.extra)
  if (!Number.isInteger(expiresAtMs) || expiresAtMs <= 0) {
    return null
  }

  return {
    expiresAt: new Date(expiresAtMs),
    subscriberId: parsed.subscriberId,
  }
}

export function createNewsletterUnsubscribeToken(
  subscriberId: string,
  subscribedAt: Date | string
) {
  return createNewsletterToken(
    NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE,
    subscriberId,
    String(toSubscriptionStartedAt(subscribedAt))
  )
}

export function parseNewsletterUnsubscribeToken(token: string) {
  const parsed = parseSignedNewsletterToken(token, NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE)

  if (!parsed) {
    return null
  }

  const subscribedAtMs = Number(parsed.extra)
  if (!Number.isInteger(subscribedAtMs) || subscribedAtMs <= 0) {
    return null
  }

  return {
    subscriberId: parsed.subscriberId,
    subscribedAt: new Date(subscribedAtMs),
  }
}

export async function recordNewsletterSubscriptionEvent(
  input: NewsletterSubscriptionEventInput,
  database: Pick<typeof db, 'insert'> = db
) {
  await database.insert(newsletterSubscriptionEvents).values({
    email: input.email.trim().toLowerCase(),
    eventSource: input.eventSource,
    eventType: input.eventType,
    subscriberId: input.subscriberId,
  })
}

function buildConfirmationEmailHtml(confirmUrl: string, siteUrl: string): string {
  const privacyUrl = buildAbsoluteUrl(siteUrl, '/legal#privacidad')
  return buildNewsletterConfirmationEmailHtml(confirmUrl, privacyUrl, siteUrl)
}

function buildConfirmationEmailText(confirmUrl: string, siteUrl: string): string {
  const privacyUrl = buildAbsoluteUrl(siteUrl, '/legal#privacidad')

  return `Confirma tu suscripción a la newsletter de CREUP

Hemos recibido una solicitud para suscribir esta dirección a la newsletter de CREUP.

Confirma tu consentimiento aquí:
${confirmUrl}

Si no has solicitado esta suscripción, ignora este correo y no se activará ninguna alta.

Información sobre protección de datos:
${privacyUrl}
`
}

function buildAlreadySubscribedEmailHtml(unsubscribeUrl: string, siteUrl: string): string {
  return buildNewsletterAlreadySubscribedEmailHtml(unsubscribeUrl, siteUrl)
}

function buildAlreadySubscribedEmailText(unsubscribeUrl: string): string {
  return `Ya estás suscrito/a a la newsletter de CREUP

Hemos recibido una nueva solicitud de suscripción para esta dirección, pero ya estás suscrito/a.

No es necesario que hagas nada. Seguirás recibiendo nuestras newsletters normalmente.

Si no fuiste tú quien envió esta solicitud, puedes ignorar este correo con total tranquilidad.

¿Quieres gestionar tu suscripción? ${unsubscribeUrl}
`
}

export async function sendNewsletterAlreadySubscribedEmail(
  email: string,
  subscriberId: string,
  subscribedAt: Date,
  configErrorMessage = 'Server configuration error.'
): Promise<void> {
  const transporter = await ensureSmtpTransporterVerified(configErrorMessage)
  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(undefined, configErrorMessage))
  const fromEmail = getRequiredSmtpFromEmail(undefined, configErrorMessage)
  const unsubscribeToken = createNewsletterUnsubscribeToken(subscriberId, subscribedAt)
  const unsubscribeUrl = buildAbsoluteUrl(
    siteUrl,
    `/desuscribirse?token=${encodeURIComponent(unsubscribeToken)}`
  )

  await transporter.sendMail({
    from: `"CREUP Newsletter" <${fromEmail}>`,
    to: email,
    subject: 'Ya estás suscrito/a a la newsletter de CREUP',
    text: buildAlreadySubscribedEmailText(unsubscribeUrl),
    html: buildAlreadySubscribedEmailHtml(unsubscribeUrl, siteUrl),
  })
}

export async function sendNewsletterConfirmationEmail(
  email: string,
  subscriberId: string,
  confirmTokenExpiresAt: Date,
  locale: string,
  locales: LocaleDefinition[],
  defaultLocale: string,
  configErrorMessage = 'Server configuration error.'
): Promise<void> {
  const transporter = await ensureSmtpTransporterVerified(configErrorMessage)

  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(undefined, configErrorMessage))
  const confirmToken = createNewsletterConfirmToken(subscriberId, confirmTokenExpiresAt)
  const confirmPath = buildLocalizedPathFromLocale(
    '/confirmar-suscripcion',
    locale,
    locales,
    defaultLocale
  )
  const confirmUrl = buildAbsoluteUrl(
    siteUrl,
    `${confirmPath}?token=${encodeURIComponent(confirmToken)}`
  )
  const fromEmail = getRequiredSmtpFromEmail(undefined, configErrorMessage)

  await transporter.sendMail({
    from: `"CREUP Newsletter" <${fromEmail}>`,
    to: email,
    subject: 'Confirma tu suscripción a la newsletter de CREUP',
    text: buildConfirmationEmailText(confirmUrl, siteUrl),
    html: buildConfirmationEmailHtml(confirmUrl, siteUrl),
  })
}

export function createConfirmTokenExpiresAt(): Date {
  return new Date(Date.now() + NEWSLETTER_CONFIRM_TOKEN_TTL_MS)
}

/**
 * Expires pending (unconfirmed) confirmation tokens that have passed their TTL.
 *
 * Instead of deleting the subscriber row — which would orphan audit events and
 * force a full re-insert on re-subscribe — we null out the token fields and
 * record a `confirmation_expired` event so the audit trail stays complete.
 * The subscriber row remains in an inactive state and will be naturally
 * overwritten if the same email re-subscribes.
 */
export async function cleanupExpiredNewsletterConfirmTokens(now: Date = new Date()) {
  const expiredRows = await db
    .select({ id: newsletterSubscribers.id, email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.active, false),
        isNotNull(newsletterSubscribers.confirmTokenExpiresAt),
        lte(newsletterSubscribers.confirmTokenExpiresAt, now)
      )
    )

  if (expiredRows.length === 0) {
    return 0
  }

  const clearExpiredRowsIndividually = async () => {
    let clearedCount = 0

    for (const row of expiredRows) {
      try {
        await db.transaction(async (tx) => {
          await tx
            .update(newsletterSubscribers)
            .set({ confirmToken: null, confirmTokenExpiresAt: null })
            .where(eq(newsletterSubscribers.id, row.id))

          await tx.insert(newsletterSubscriptionEvents).values({
            email: row.email,
            eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.confirmationExpired,
            eventSource: NEWSLETTER_CONSENT_SOURCES.system,
            subscriberId: row.id,
          })
        })
        clearedCount++
      } catch (error) {
        logError('newsletter.confirm-token.cleanup.row', error, { subscriberId: row.id })
      }
    }

    return clearedCount
  }

  try {
    const expiredIds = expiredRows.map((row) => row.id)
    await db.transaction(async (tx) => {
      await tx
        .update(newsletterSubscribers)
        .set({ confirmToken: null, confirmTokenExpiresAt: null })
        .where(inArray(newsletterSubscribers.id, expiredIds))

      await tx.insert(newsletterSubscriptionEvents).values(
        expiredRows.map((row) => ({
          email: row.email,
          eventType: NEWSLETTER_SUBSCRIPTION_EVENT_TYPES.confirmationExpired,
          eventSource: NEWSLETTER_CONSENT_SOURCES.system,
          subscriberId: row.id,
        }))
      )
    })

    return expiredRows.length
  } catch (error) {
    logError('newsletter.confirm-token.cleanup.batch', error)
  }

  return clearExpiredRowsIndividually()
}
