import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { and, eq, isNotNull, lte } from 'drizzle-orm'
import { db } from '../db'
import { newsletterSubscribers, newsletterSubscriptionEvents } from '../db/schema'
import { logError } from './logger'
import { getRequiredSiteUrl, getRequiredSmtpFromEmail } from './runtimeConfig'
import { buildAbsoluteUrl, getClientIp, getUserAgent, normalizeBaseUrl } from './urlBuilder'
import { getSmtpTransporter } from './smtpTransporter'
import { getOptionalConfigString, requireConfigString } from '~~/shared/utils/config'
import { buildLocalizedPathFromLocale, type LocaleDefinition } from '~~/shared/utils/locale'

export const NEWSLETTER_CONSENT_TEXT_VERSION = '2026-03-06'

/** Confirmation tokens expire after 48 hours */
export const NEWSLETTER_CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000
const NEWSLETTER_TOKEN_VERSION = 'v1'
const NEWSLETTER_TOKEN_SEPARATOR = '.'
const NEWSLETTER_TOKEN_KIND_CONFIRM = 'confirm'
const NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE = 'unsubscribe'

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
  kind: typeof NEWSLETTER_TOKEN_KIND_CONFIRM | typeof NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE,
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
  const subscriptionStartedAt =
    subscribedAt instanceof Date ? subscribedAt.getTime() : new Date(subscribedAt).getTime()

  if (!Number.isInteger(subscriptionStartedAt) || subscriptionStartedAt <= 0) {
    throw new Error('Invalid newsletter subscription timestamp')
  }

  return createNewsletterToken(
    NEWSLETTER_TOKEN_KIND_UNSUBSCRIBE,
    subscriberId,
    String(subscriptionStartedAt)
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

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirma tu suscripción a la newsletter de CREUP</title>
</head>
<body style="margin:0; padding:24px; background:#f6f4f1; color:#1f2937; font-family:Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
    <tr>
      <td style="padding:32px 24px 16px 24px;">
        <h1 style="margin:0 0 16px 0; font-size:28px; line-height:1.2; color:#792225;">Confirma tu suscripción</h1>
        <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
          Hemos recibido una solicitud para suscribir esta dirección a la newsletter de CREUP.
        </p>
        <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6;">
          Para activar la suscripción, confirma tu consentimiento haciendo clic en el siguiente botón.
        </p>
        <p style="margin:0 0 24px 0; text-align:center;">
          <a href="${confirmUrl}" style="display:inline-block; padding:14px 28px; background:#792225; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:700;">
            Confirmar suscripción
          </a>
        </p>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5563;">
          Si no has solicitado esta suscripción, puedes ignorar este correo y no se activará ninguna alta.
        </p>
        <p style="margin:0; font-size:13px; line-height:1.6; color:#6b7280;">
          Información sobre protección de datos:
          <a href="${privacyUrl}" style="color:#792225;">aviso legal y política de privacidad</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
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

function buildAlreadySubscribedEmailHtml(unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ya estás suscrito/a a la newsletter de CREUP</title>
</head>
<body style="margin:0; padding:24px; background:#f6f4f1; color:#1f2937; font-family:Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
    <tr>
      <td style="padding:32px 24px 16px 24px;">
        <h1 style="margin:0 0 16px 0; font-size:28px; line-height:1.2; color:#792225;">Ya estás suscrito/a</h1>
        <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
          Hemos recibido una nueva solicitud de suscripción para esta dirección, pero ya estás suscrito/a a la newsletter de CREUP.
        </p>
        <p style="margin:0 0 24px 0; font-size:16px; line-height:1.6;">
          No es necesario que hagas nada. Seguirás recibiendo nuestras newsletters normalmente.
        </p>
        <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5563;">
          Si no fuiste tú quien envió esta solicitud, puedes ignorar este correo con total tranquilidad.
        </p>
        <p style="margin:0; font-size:13px; line-height:1.6; color:#6b7280;">
          ¿Quieres darte de baja?
          <a href="${unsubscribeUrl}" style="color:#792225;">Darme de baja</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
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
  const transporter = getSmtpTransporter(configErrorMessage)
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
    html: buildAlreadySubscribedEmailHtml(unsubscribeUrl),
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
  const transporter = getSmtpTransporter(configErrorMessage)

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
