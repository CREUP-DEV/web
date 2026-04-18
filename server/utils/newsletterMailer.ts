import { NEWSLETTER_BRAND_BANNER_PATH } from '~~/shared/constants/assetPaths'
import { createNewsletterUnsubscribeToken } from './newsletterSubscribers'
import { getRequiredSiteUrl, getRequiredSmtpFromEmail } from './runtimeConfig'
import { ensureSmtpTransporterVerified } from './smtpTransporter'
import { buildAbsoluteUrl, normalizeBaseUrl } from './urlBuilder'

interface Newsletter {
  id: string
  month: Date
  coverImage: string | null
  pdfUrl: string
}

interface Subscriber {
  id: string
  email: string
  subscribedAt: Date
}

function formatMonth(date: Date): string {
  const month = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    timeZone: 'Europe/Madrid',
  }).format(date)
  const year = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(date)
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1)
  return `${monthCapitalized} de ${year}`
}

function buildEmailHtml(
  newsletter: Newsletter,
  unsubscribeUrl: string,
  siteUrl: string,
  resolvedCoverPath: string | null
): string {
  const monthStr = formatMonth(new Date(newsletter.month))
  const pdfFullUrl = buildAbsoluteUrl(siteUrl, newsletter.pdfUrl)
  const coverFullUrl = resolvedCoverPath ? buildAbsoluteUrl(siteUrl, resolvedCoverPath) : null
  const newsletterArchiveUrl = buildAbsoluteUrl(siteUrl, '/prensa/newsletter')
  const bannerImageUrl = buildAbsoluteUrl(siteUrl, NEWSLETTER_BRAND_BANNER_PATH)
  const coverRow = coverFullUrl
    ? `<tr>
                  <td align="center" style="padding: 16px;">
                    <img src="${coverFullUrl}" alt="Portada newsletter ${monthStr}" width="280"
                      style="display:block; width:280px; max-width:100%; height:auto; border-radius:8px;" />
                  </td>
                </tr>`
    : ''

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
          <tr>
            <td align="center" style="padding: 20px 8px 8px 8px;">
              <h1 style="margin:0; font-size:28px; line-height:36px; font-weight:700; font-family: 'Red Rose', Georgia, serif; color:#2c2c2c;">
                Newsletter CREUP
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 8px 8px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="background:#ffffff; border-top: 4px solid #792225; border-top-left-radius:5px; border-top-right-radius:5px;">
                <tr>
                  <td align="center" style="padding: 24px 16px 8px 16px; font-family: 'Raleway', Arial, sans-serif; font-size:20px; font-weight:bold; color:#2c2c2c;">
                    ${monthStr}
                  </td>
                </tr>
                ${coverRow}
                <tr>
                  <td style="padding: 0 24px 16px 24px; font-family: 'Raleway', Arial, sans-serif; font-size:16px; line-height:26px; color:#2c2c2c; text-align:center;">
                    Ya está disponible la newsletter de CREUP del mes de ${monthStr}. Puedes descargarla haciendo clic en el botón de abajo.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 8px 16px 24px 16px;">
                    <a href="${pdfFullUrl}" target="_blank"
                      style="display:inline-block; padding:14px 32px; background-color:#792225; color:#ffffff; font-family: 'Raleway', Arial, sans-serif; font-size:16px; font-weight:bold; text-decoration:none; border-radius:6px;">
                      Descargar Newsletter
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 16px;">
                    <hr style="border:none; border-top:1px solid #eeeeee; margin:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 16px 16px 16px; font-family: 'Raleway', Arial, sans-serif; font-size:12px; color:#999999; line-height:18px; text-align:center;">
                    Recibes este correo porque estás suscrito/a a la newsletter de CREUP.
                    <br />
                    <a href="${unsubscribeUrl}" style="color:#792225; text-decoration:none;">Darme de baja</a>
                    · <a href="${newsletterArchiveUrl}" style="color:#792225; text-decoration:none;">Ver todas las newsletters</a>
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

function buildNewsletterMessageId(newsletterId: string, subscriberId: string, siteUrl: string) {
  const host = new URL(siteUrl).host.replace(/[^a-z0-9.-]/gi, '')
  return `<newsletter-${newsletterId}-${subscriberId}@${host}>`
}

export async function sendNewsletterEmail(
  newsletter: Newsletter,
  subscriber: Subscriber,
  configErrorMessage = 'Server configuration error.',
  resolvedCoverPath: string | null = null
) {
  const transporter = await ensureSmtpTransporterVerified(configErrorMessage)
  const fromEmail = getRequiredSmtpFromEmail(undefined, configErrorMessage)
  const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(undefined, configErrorMessage))
  const monthStr = formatMonth(new Date(newsletter.month))
  const subject = `Newsletter CREUP — ${monthStr}`
  const unsubscribeToken = createNewsletterUnsubscribeToken(subscriber.id, subscriber.subscribedAt)
  const unsubscribeUrl = buildAbsoluteUrl(
    siteUrl,
    `/desuscribirse?token=${encodeURIComponent(unsubscribeToken)}`
  )

  await transporter.sendMail({
    from: `"CREUP Newsletter" <${fromEmail}>`,
    to: subscriber.email,
    subject,
    text: buildEmailText(newsletter, unsubscribeUrl, siteUrl),
    html: buildEmailHtml(newsletter, unsubscribeUrl, siteUrl, resolvedCoverPath),
    messageId: buildNewsletterMessageId(newsletter.id, subscriber.id, siteUrl),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
    },
  })
}
