import { defineEventHandler, readBody, createError } from 'h3'
import {
  getRequiredSmtpFromEmail,
  getRequiredSmtpPressEmail,
  getRequiredSmtpToEmail,
  getRequiredSiteUrl,
} from '../utils/runtimeConfig'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { validateBody } from '../utils/validation'
import { enforceRateLimit } from '../utils/rateLimit'
import { getSmtpTransporter } from '../utils/smtpTransporter'
import { logError } from '../utils/logger'
import { NEWSLETTER_BRAND_BANNER_PATH } from '~~/shared/constants/assetPaths'
import { contactFormSchema } from '~~/shared/utils/contactValidation'
import { normalizeBaseUrl, buildAbsoluteUrl } from '../utils/urlBuilder'

const SPAM_PATTERNS = [
  /\[url=/i,
  /\[link=/i,
  /<a\s+href/i,
  /https?:\/\/[^\s]{256,}/i,
  /(.)\1{10,}/i,
  /viagra|cialis|casino|lottery|winner|bitcoin|crypto|investment|earn money/i,
]

function hasSpamPatterns(text: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(text))
}

function sanitize(input: string, maxLen = 5000): string {
  return input.trim().slice(0, maxLen)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeHtmlForAttribute(value: string): string {
  return escapeHtml(value)
}

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    namespace: 'contact',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    errorMessage: getPublicApiErrorMessage(event, 'contactRateLimited'),
  })

  const raw = await readBody(event)
  const body = validateBody(contactFormSchema, raw)

  if (body.website && body.website.trim() !== '') {
    return { success: true }
  }

  const contactType = body.contactType || 'general'
  const name = sanitize(body.name, 100)
  const email = sanitize(body.email, 254)
  const phone = body.phone ? sanitize(body.phone, 30) : ''
  const mediaName = body.mediaName ? sanitize(body.mediaName, 200) : ''
  const subject = sanitize(body.subject, 200)
  const message = sanitize(body.message, 5000)
  const isPress = contactType === 'press'

  // Check all user-provided fields for spam patterns
  if (hasSpamPatterns(`${name} ${email} ${subject} ${message}`)) {
    throw createError({
      statusCode: 400,
      message: getPublicApiErrorMessage(event, 'contactSpamDetected'),
    })
  }

  const publicConfigMessage = getPublicApiErrorMessage(event, 'contactEmailServiceUnavailable')
  const toEmail = isPress
    ? getRequiredSmtpPressEmail(event, publicConfigMessage)
    : getRequiredSmtpToEmail(event, publicConfigMessage)
  const fromEmail = getRequiredSmtpFromEmail(event, publicConfigMessage)
  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(event, publicConfigMessage))

  const transporter = getSmtpTransporter(publicConfigMessage)

  const sentAt = new Date().toISOString()
  const contactPageUrl = buildAbsoluteUrl(siteUrl, '/contacto')
  const bannerImageUrl = buildAbsoluteUrl(siteUrl, NEWSLETTER_BRAND_BANNER_PATH)

  const contactLabel = isPress ? 'prensa' : 'contacto'
  const escapedName = escapeHtml(name)
  const escapedEmail = escapeHtmlForAttribute(email)
  const escapedEmailText = escapeHtml(email)
  const escapedSubject = escapeHtml(subject)
  const escapedPhone = escapeHtml(phone || '(no indicado)')
  const escapedMediaName = escapeHtml(mediaName)
  const escapedMessage = escapeHtml(message).replace(/\n/g, '<br />')
  const escapedContactLabel = escapeHtml(contactLabel)

  const textBody = `
Nuevo mensaje de ${contactLabel} desde la web de CREUP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
De: ${name} <${email}>${isPress ? `\nTeléfono: ${phone || '(no indicado)'}\nMedio: ${mediaName}` : ''}
Asunto: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Enviado desde: ${contactPageUrl}
Fecha: ${sentAt}
`.trim()

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nuevo mensaje de ${escapedContactLabel}</title>
</head>
<body style="margin:0; padding:0; background-color:#eaeaea;">
  <div style="display:none; font-size:1px; color:#eaeaea; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Mensaje de <b>${escapedName}</b>${isPress ? ` (${escapedMediaName})` : ''} - ${escapedSubject}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#eaeaea">
    <tr>
      <td align="center" style="padding: 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; background:transparent;">
          <tr>
            <td align="center" style="padding: 20px 8px 8px 8px;">
              <h1 style="margin:0; font-size:28px; line-height:36px; font-weight:700; font-family: Georgia, serif; color:#2c2c2c;">
                Nuevo mensaje de ${escapedContactLabel}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 8px 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="background:#ffffff; border-top: 4px solid #792225; border-top-left-radius:5px; border-top-right-radius:5px;">
                <tr>
                  <td style="padding: 16px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">De:</strong>
                    ${escapedName}
                    &lt;<a href="mailto:${escapedEmail}" style="color:#792225; text-decoration:none;">${escapedEmailText}</a>&gt;
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">Asunto:</strong> ${escapedSubject}
                  </td>
                </tr>${
                  isPress
                    ? `
                <tr>
                  <td style="padding: 6px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">Teléfono:</strong> ${escapedPhone}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">Medio:</strong> ${escapedMediaName}
                  </td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 12px 16px 0 16px;">
                    <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; font-family: Arial, sans-serif; color:#2c2c2c; font-size:16px; line-height:26px;">${escapedMessage}</td>
                </tr>
                <tr>
                  <td style="padding: 0 16px 0 16px;">
                    <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px 16px 16px; font-family: Arial, sans-serif; font-size:12px; color:#999999; line-height:18px;">
                    Enviado desde
                    <a href="${contactPageUrl}" style="color:#792225; text-decoration:none;">${contactPageUrl}</a>
                    · ${sentAt}
                    <br />
                    Puedes responder a este correo para contactar directamente con <strong>${escapedName}</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 8px 20px 8px;">
              <img src="${bannerImageUrl}" alt="CREUP" width="600"
                style="display:block; width:100%; height:auto; margin:0 auto;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: `"CREUP ${isPress ? 'Prensa' : 'Contacto'}" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `[CREUP ${isPress ? 'Prensa' : 'Web'}] ${subject}`,
      text: textBody,
      html: htmlBody,
    })

    return { success: true }
  } catch (err) {
    logError('contact.send', err, { contactType })
    throw createError({
      statusCode: 500,
      message: getPublicApiErrorMessage(event, 'contactEmailServiceUnavailable'),
    })
  }
})
