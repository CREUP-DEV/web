import { createNewsletterUnsubscribeToken } from '../newsletter/newsletterSubscribers'
import { getRequiredSiteUrl, getRequiredSmtpFromEmail } from '../core/runtimeConfig'
import { ensureSmtpTransporterVerified } from './smtpTransporter'
import { buildAbsoluteUrl, normalizeBaseUrl } from '../core/urlBuilder'
import { buildNewsletterDeliveryEmailHtml } from './emailTemplates'

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
  return buildNewsletterDeliveryEmailHtml({
    archiveUrl: newsletterArchiveUrl,
    coverAlt: `Portada newsletter ${monthStr}`,
    coverUrl: coverFullUrl,
    monthLabel: monthStr,
    pdfUrl: pdfFullUrl,
    siteUrl,
    unsubscribeUrl,
  })
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
  const subject = `Newsletter CREUP - ${monthStr}`
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
