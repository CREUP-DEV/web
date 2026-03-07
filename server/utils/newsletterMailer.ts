/**
 * Newsletter mailer utility
 * Sends a newsletter notification email to all active subscribers.
 * Uses batching (50 per batch, 2s delay between batches) to respect
 * typical SMTP rate limits and avoid timeouts.
 */
import nodemailer from 'nodemailer'

interface Newsletter {
  id: string
  month: Date
  coverImage: string
  pdfUrl: string
}

interface Subscriber {
  id: string
  email: string
  unsubscribeToken: string
}

interface NewsletterEmailSendResult {
  errorCount: number
  sentCount: number
  total: number
}

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function buildAbsoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`
}

/**
 * Format the newsletter month for display.
 */
function formatMonth(date: Date): string {
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ]
  return `${months[date.getMonth()]} de ${date.getFullYear()}`
}

/**
 * Build the newsletter notification email HTML.
 */
function buildEmailHtml(newsletter: Newsletter, unsubscribeUrl: string, siteUrl: string): string {
  const monthStr = formatMonth(new Date(newsletter.month))
  const pdfFullUrl = buildAbsoluteUrl(siteUrl, newsletter.pdfUrl)
  const coverFullUrl = buildAbsoluteUrl(siteUrl, newsletter.coverImage)
  const newsletterArchiveUrl = buildAbsoluteUrl(siteUrl, '/prensa/newsletter')
  const bannerImageUrl = buildAbsoluteUrl(
    siteUrl,
    '/documentos/imagen/MIC/horizontal-completo-granate.png'
  )

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Newsletter CREUP — ${monthStr}</title>
</head>
<body style="margin:0; padding:0; background-color:#eaeaea;">
  <div style="display:none; font-size:1px; color:#eaeaea; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    Ya está disponible la newsletter de CREUP de ${monthStr}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#eaeaea">
    <tr>
      <td align="center" style="padding: 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px; background:transparent;">

          <!-- Title -->
          <tr>
            <td align="center" style="padding: 20px 8px 8px 8px;">
              <h1 style="margin:0; font-size:28px; line-height:36px; font-weight:700; font-family: Georgia, serif; color:#2c2c2c;">
                Newsletter CREUP
              </h1>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="padding: 0 8px 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="background:#ffffff; border-top: 4px solid #792225; border-top-left-radius:5px; border-top-right-radius:5px;">

                <!-- Month heading -->
                <tr>
                  <td align="center" style="padding: 24px 16px 8px 16px; font-family: Arial, sans-serif; font-size:20px; font-weight:bold; color:#2c2c2c;">
                    ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}
                  </td>
                </tr>

                <!-- Cover image -->
                <tr>
                  <td align="center" style="padding: 16px;">
                    <img src="${coverFullUrl}" alt="Portada newsletter ${monthStr}" width="280"
                      style="display:block; width:280px; max-width:100%; height:auto; border-radius:8px;" />
                  </td>
                </tr>

                <!-- Intro text -->
                <tr>
                  <td style="padding: 0 24px 16px 24px; font-family: Arial, sans-serif; font-size:16px; line-height:26px; color:#2c2c2c; text-align:center;">
                    Ya está disponible la newsletter de CREUP del mes de ${monthStr}. Puedes descargarla haciendo clic en el botón de abajo.
                  </td>
                </tr>

                <!-- CTA button -->
                <tr>
                  <td align="center" style="padding: 8px 16px 24px 16px;">
                    <a href="${pdfFullUrl}" target="_blank"
                      style="display:inline-block; padding:14px 32px; background-color:#792225; color:#ffffff; font-family:Arial, sans-serif; font-size:16px; font-weight:bold; text-decoration:none; border-radius:6px;">
                      Descargar Newsletter
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 16px;">
                    <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
                  </td>
                </tr>

                <!-- Footer text -->
                <tr>
                  <td style="padding: 16px 16px 16px 16px; font-family: Arial, sans-serif; font-size:12px; color:#999999; line-height:18px; text-align:center;">
                    Recibes este correo porque estás suscrito/a a la newsletter de CREUP.
                    <br />
                    <a href="${unsubscribeUrl}" style="color:#792225; text-decoration:none;">Darme de baja</a>
                    · <a href="${newsletterArchiveUrl}" style="color:#792225; text-decoration:none;">Ver todas las newsletters</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Banner -->
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
}

function buildEmailText(newsletter: Newsletter, unsubscribeUrl: string, siteUrl: string): string {
  const monthStr = formatMonth(new Date(newsletter.month))
  const pdfFullUrl = buildAbsoluteUrl(siteUrl, newsletter.pdfUrl)
  const newsletterArchiveUrl = buildAbsoluteUrl(siteUrl, '/prensa/newsletter')

  return `Newsletter CREUP — ${monthStr}

Ya está disponible la newsletter de CREUP del mes de ${monthStr}.

Descárgala aquí: ${pdfFullUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Recibes este correo porque estás suscrito/a a la newsletter de CREUP.
Para darte de baja: ${unsubscribeUrl}
Todas las newsletters: ${newsletterArchiveUrl}
`
}

/**
 * Send newsletter notification to all provided subscribers in batches.
 */
export async function sendNewsletterEmails(
  newsletter: Newsletter,
  subscribers: Subscriber[]
): Promise<NewsletterEmailSendResult> {
  if (subscribers.length === 0) {
    return {
      errorCount: 0,
      sentCount: 0,
      total: 0,
    }
  }

  const config = useRuntimeConfig()

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    throw new Error('SMTP_CONFIG_MISSING')
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

  const fromEmail = (config.smtpFromEmail as string) || 'info@creup.es'
  const siteUrl = normalizeBaseUrl((config.siteUrl as string) || 'https://www.creup.es')
  const monthStr = formatMonth(new Date(newsletter.month))
  const subject = `Newsletter CREUP — ${monthStr.charAt(0).toUpperCase() + monthStr.slice(1)}`

  let sentCount = 0
  let errorCount = 0

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)

    for (const subscriber of batch) {
      const unsubscribeUrl = buildAbsoluteUrl(
        siteUrl,
        `/api/newsletter-unsubscribe?token=${encodeURIComponent(subscriber.unsubscribeToken)}`
      )

      try {
        await transporter.sendMail({
          from: `"CREUP Newsletter" <${fromEmail}>`,
          to: subscriber.email,
          subject,
          text: buildEmailText(newsletter, unsubscribeUrl, siteUrl),
          html: buildEmailHtml(newsletter, unsubscribeUrl, siteUrl),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        sentCount++
      } catch (err) {
        errorCount++
        console.error(`Failed to send newsletter to ${subscriber.email}:`, err)
      }
    }

    // Pause between batches to respect rate limits
    if (i + BATCH_SIZE < subscribers.length) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  console.log(
    `Newsletter "${subject}" sent: ${sentCount} delivered, ${errorCount} failed out of ${subscribers.length} total`
  )

  return {
    errorCount,
    sentCount,
    total: subscribers.length,
  }
}
