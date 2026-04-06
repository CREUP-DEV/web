import { createId } from '@paralleldrive/cuid2'
import type { H3Event } from 'h3'
import { getRequiredSiteUrl, getRequiredSmtpFromEmail } from './runtimeConfig'
import { buildAbsoluteUrl, getClientIp, getUserAgent, normalizeBaseUrl } from './urlBuilder'
import { getSmtpTransporter } from './smtpTransporter'

export const NEWSLETTER_CONSENT_TEXT_VERSION = '2026-03-06'

/** Confirmation tokens expire after 48 hours */
export const NEWSLETTER_CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000

export const NEWSLETTER_CONSENT_SOURCES = {
  adminManual: 'admin_manual',
  legacyImport: 'legacy_import',
  webForm: 'web_form',
} as const

export function getNewsletterConsentEvidence(event: H3Event) {
  return {
    ageConfirmed: true,
    consentIp: getClientIp(event),
    consentSource: NEWSLETTER_CONSENT_SOURCES.webForm,
    consentTextVersion: NEWSLETTER_CONSENT_TEXT_VERSION,
    consentUserAgent: getUserAgent(event),
  }
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

export async function sendNewsletterConfirmationEmail(
  email: string,
  confirmToken: string,
  configErrorMessage = 'Server configuration error.'
): Promise<void> {
  const transporter = getSmtpTransporter(configErrorMessage)

  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(undefined, configErrorMessage))
  const confirmUrl = buildAbsoluteUrl(
    siteUrl,
    `/api/newsletter-confirm?token=${encodeURIComponent(confirmToken)}`
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

export function createNewsletterConfirmToken(): string {
  return createId()
}

export function createNewsletterUnsubscribeToken(): string {
  return createId()
}

export function createConfirmTokenExpiresAt(): Date {
  return new Date(Date.now() + NEWSLETTER_CONFIRM_TOKEN_TTL_MS)
}
