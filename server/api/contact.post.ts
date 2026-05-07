import { defineEventHandler, readBody, createError } from 'h3'
import {
  getRequiredSmtpFromEmail,
  getRequiredSmtpPressEmail,
  getRequiredSmtpToEmail,
  getRequiredSiteUrl,
} from '../utils/core/runtimeConfig'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { validatePublicBody } from '../utils/validation'
import { enforceRateLimit } from '../utils/public/rateLimit'
import { ensureSmtpTransporterVerified } from '../utils/email/smtpTransporter'
import { logError } from '../utils/core/logger'
import { contactFormSchema } from '~~/shared/utils/contactValidation'
import { normalizeBaseUrl, buildAbsoluteUrl } from '../utils/core/urlBuilder'
import {
  hasMinimumPublicFormSubmitDelay,
  verifyTurnstileTokenOrThrow,
} from '../utils/core/turnstile'
import {
  buildContactEmailHtml,
  escapeHtml,
  escapeHtmlForAttribute,
} from '../utils/email/emailTemplates'

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

function sanitizeEmailHeaderValue(value: string): string {
  return value.replace(/[\r\n\0]/g, '')
}

function assertNoEmailHeaderInjection(value: string, message: string) {
  if (/[\r\n]/.test(value)) {
    throw createError({
      statusCode: 400,
      message,
    })
  }
}

export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, {
    namespace: 'contact',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    errorMessage: getPublicApiErrorMessage(event, 'contactRateLimited'),
  })

  const raw = await readBody(event)
  const body = validatePublicBody(event, contactFormSchema, raw)

  const antiSpamValidationFailedMessage = getPublicApiErrorMessage(
    event,
    'antiSpamValidationFailed'
  )

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

  const contactType = body.contactType || 'general'
  const name = sanitize(body.name, 100)
  const email = sanitize(body.email, 254)
  const phone = body.phone ? sanitize(body.phone, 30) : ''
  const mediaName = body.mediaName ? sanitize(body.mediaName, 200) : ''
  const subject = sanitize(body.subject, 200)
  const message = sanitize(body.message, 5000)
  const replyToEmail = sanitizeEmailHeaderValue(email)
  const isPress = contactType === 'press'

  assertNoEmailHeaderInjection(email, antiSpamValidationFailedMessage)
  assertNoEmailHeaderInjection(subject, antiSpamValidationFailedMessage)

  // Check all user-provided fields for spam patterns
  if (hasSpamPatterns(`${name} ${email} ${phone} ${mediaName} ${subject} ${message}`)) {
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

  assertNoEmailHeaderInjection(toEmail, publicConfigMessage)
  assertNoEmailHeaderInjection(fromEmail, publicConfigMessage)

  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(event, publicConfigMessage))

  const transporter = await ensureSmtpTransporterVerified(publicConfigMessage)

  const sentAt = new Date().toISOString()
  const contactPageUrl = buildAbsoluteUrl(siteUrl, '/contacto')

  const contactLabel = isPress ? 'prensa' : 'contacto'
  const escapedName = escapeHtml(name)
  const escapedEmail = escapeHtmlForAttribute(email)
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

  const htmlBody = buildContactEmailHtml({
    contactLabel: escapedContactLabel,
    contactPageUrl,
    email: escapedEmail,
    isPress,
    mediaName: escapedMediaName,
    messageHtml: escapedMessage,
    name: escapedName,
    phone: escapedPhone,
    sentAt,
    siteUrl,
    subject: escapedSubject,
  })

  try {
    await transporter.sendMail({
      from: `"CREUP ${isPress ? 'Prensa' : 'Contacto'}" <${fromEmail}>`,
      to: toEmail,
      replyTo: replyToEmail,
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
