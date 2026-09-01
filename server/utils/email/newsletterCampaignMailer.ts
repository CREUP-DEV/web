import { ensureSmtpTransporterVerified } from './smtpTransporter'
import { getRequiredSmtpFromEmail } from '../core/runtimeConfig'
import {
  applyCampaignUnsubscribeUrl,
  buildCampaignUnsubscribeUrls,
  type RenderedCampaignEmail,
} from './newsletterCampaignRender'

/**
 * Sends an already-rendered campaign email.
 *
 * The render is shared by every subscriber of a locale; what this adds per recipient is the signed
 * unsubscribe URL that replaces the sentinel, and the RFC 8058 headers, which never go through the
 * sentinel because they are not part of the body.
 */

const FROM_NAME = 'CREUP Newsletter'

export interface CampaignEmailRecipient {
  id: string
  email: string
  subscribedAt: Date | string
}

function buildCampaignMessageId(campaignId: string, subscriberId: string, siteUrl: string) {
  const host = new URL(siteUrl).host.replace(/[^a-z0-9.-]/gi, '')
  return `<campaign-${campaignId}-${subscriberId}@${host}>`
}

export async function sendNewsletterCampaignEmail(options: {
  campaignId: string
  rendered: RenderedCampaignEmail
  recipient: CampaignEmailRecipient
  siteUrl: string
  configErrorMessage?: string
}) {
  const transporter = await ensureSmtpTransporterVerified(options.configErrorMessage)
  const fromEmail = getRequiredSmtpFromEmail(undefined, options.configErrorMessage)
  const unsubscribeUrls = buildCampaignUnsubscribeUrls({
    siteUrl: options.siteUrl,
    campaignId: options.campaignId,
    subscriberId: options.recipient.id,
    subscribedAt: options.recipient.subscribedAt,
  })
  const message = applyCampaignUnsubscribeUrl(options.rendered, unsubscribeUrls.visible)

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${fromEmail}>`,
    to: options.recipient.email,
    subject: message.subject,
    text: message.text,
    html: message.html,
    messageId: buildCampaignMessageId(options.campaignId, options.recipient.id, options.siteUrl),
    headers: {
      // Points at the API route, not the page: the one-click POST is made by the mail provider.
      'List-Unsubscribe': `<${unsubscribeUrls.oneClick}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })
}

/**
 * Test send: no delivery row, no state change, no List-Unsubscribe headers. The rendered bodies
 * already carry an inert unsubscribe destination, because there is no subscription to cancel.
 */
export async function sendNewsletterCampaignTestEmail(options: {
  rendered: RenderedCampaignEmail
  to: string
  configErrorMessage?: string
}) {
  const transporter = await ensureSmtpTransporterVerified(options.configErrorMessage)
  const fromEmail = getRequiredSmtpFromEmail(undefined, options.configErrorMessage)

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${fromEmail}>`,
    to: options.to,
    subject: options.rendered.subject,
    text: options.rendered.text,
    html: options.rendered.html,
  })
}
