/**
 * POST /api/contact
 * Public contact form handler.
 * Validates input with Zod, applies rate-limiting and spam checks,
 * then sends an email to info@creup.es via SMTP (nodemailer).
 */
import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import nodemailer from 'nodemailer'
import { contactFormSchema, validateBody } from '../utils/validation'

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

// ---------------------------------------------------------------------------
// Spam heuristics
// ---------------------------------------------------------------------------
const SPAM_PATTERNS = [
  /\[url=/i,
  /\[link=/i,
  /<a\s+href/i,
  /https?:\/\/[^\s]{50,}/i,
  /(.)\1{10,}/i,
  /viagra|cialis|casino|lottery|winner|bitcoin|crypto|investment|earn money/i,
]

function hasSpamPatterns(text: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(text))
}

// ---------------------------------------------------------------------------
// Sanitise user input (strip HTML-like tags, trim, cap length)
// ---------------------------------------------------------------------------
function sanitize(input: string, maxLen = 5000): string {
  return input.replace(/[<>]/g, '').trim().slice(0, maxLen)
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
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

  // Validate body with Zod
  const raw = await readBody(event)
  const body = validateBody(contactFormSchema, raw)

  // Honeypot — if filled it's very likely a bot; silently "succeed"
  if (body.website && body.website.trim() !== '') {
    return { success: true }
  }

  // Sanitize values after validation
  const contactType = body.contactType || 'general'
  const name = sanitize(body.name, 100)
  const email = sanitize(body.email, 254)
  const phone = body.phone ? sanitize(body.phone, 30) : ''
  const mediaName = body.mediaName ? sanitize(body.mediaName, 200) : ''
  const subject = sanitize(body.subject, 200)
  const message = sanitize(body.message, 5000)
  const isPress = contactType === 'press'

  // Spam check
  if (hasSpamPatterns(`${name} ${subject} ${message}`)) {
    throw createError({ statusCode: 400, statusMessage: 'Message contains prohibited content.' })
  }

  // SMTP configuration
  const config = useRuntimeConfig()

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.error('SMTP configuration missing', {
      hasHost: !!config.smtpHost,
      hasUser: !!config.smtpUser,
      hasPass: !!config.smtpPass,
    })
    throw createError({ statusCode: 500, statusMessage: 'Email service not configured.' })
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost as string,
    port: Number(config.smtpPort) || 587,
    secure: config.smtpSecure === 'true',
    auth: {
      user: config.smtpUser as string,
      pass: config.smtpPass as string,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  })

  const toEmail = isPress ? (config.smtpPressEmail as string) : (config.smtpToEmail as string)
  const fromEmail = (config.smtpFromEmail as string) || toEmail

  const sentAt = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

  const contactLabel = isPress ? 'prensa' : 'contacto'

  const textBody = `
Nuevo mensaje de ${contactLabel} desde la web de CREUP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
De: ${name} <${email}>${isPress ? `\nTeléfono: ${phone || '(no indicado)'}\nMedio: ${mediaName}` : ''}
Asunto: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Enviado desde: https://www.creup.es/contacto
Fecha: ${sentAt}
`.trim()

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nuevo mensaje de ${contactLabel}</title>
</head>
<body style="margin:0; padding:0; background-color:#eaeaea;">
  <div style="display:none; font-size:1px; color:#eaeaea; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Mensaje de <b>${name}</b>${isPress ? ` (${mediaName})` : ''} — ${subject}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#eaeaea">
    <tr>
      <td align="center" style="padding: 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; background:transparent;">

          <!-- Title -->
          <tr>
            <td align="center" style="padding: 20px 8px 8px 8px;">
              <h1 style="margin:0; font-size:28px; line-height:36px; font-weight:700; font-family: Georgia, serif; color:#2c2c2c;">
                Nuevo mensaje de ${contactLabel}
              </h1>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding: 0 8px 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="background:#ffffff; border-top: 4px solid #792225; border-top-left-radius:5px; border-top-right-radius:5px;">

                <!-- Sender row -->
                <tr>
                  <td style="padding: 16px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">De:</strong>
                    ${name}
                    &lt;<a href="mailto:${email}" style="color:#792225; text-decoration:none;">${email}</a>&gt;
                  </td>
                </tr>

                <!-- Subject row -->
                <tr>
                  <td style="padding: 6px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">Asunto:</strong> ${subject}
                  </td>
                </tr>${
                  isPress
                    ? `

                <!-- Phone row -->
                <tr>
                  <td style="padding: 6px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">Teléfono:</strong> ${phone || '(no indicado)'}
                  </td>
                </tr>

                <!-- Media name row -->
                <tr>
                  <td style="padding: 6px 16px 0 16px; font-family: Arial, sans-serif; font-size:14px; color:#666666;">
                    <strong style="color:#2c2c2c;">Medio:</strong> ${mediaName}
                  </td>
                </tr>`
                    : ''
                }

                <!-- Divider -->
                <tr>
                  <td style="padding: 12px 16px 0 16px;">
                    <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
                  </td>
                </tr>

                <!-- Message body -->
                <tr>
                  <td style="padding: 16px; font-family: Arial, sans-serif; color:#2c2c2c; font-size:16px; line-height:26px;">${message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />')}</td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 16px 0 16px;">
                    <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 12px 16px 16px 16px; font-family: Arial, sans-serif; font-size:12px; color:#999999; line-height:18px;">
                    Enviado desde
                    <a href="https://www.creup.es/contacto" style="color:#792225; text-decoration:none;">www.creup.es/contacto</a>
                    · ${sentAt}
                    <br />
                    Puedes responder a este correo para contactar directamente con <strong>${name}</strong>.
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td align="center" style="padding: 0 8px 20px 8px;">
              <img src="https://www.creup.es/documentos/imagen/MIC/horizontal-completo-granate.png" alt="CREUP" width="600"
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
    console.error('Error sending contact email:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send email. Please try again later.',
    })
  }
})
