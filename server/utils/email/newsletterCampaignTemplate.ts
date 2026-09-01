import type { SupportedLocaleCode } from '~~/shared/constants/locales'
import {
  NEWSLETTER_CAMPAIGN_IMAGE_WIDTH,
  NEWSLETTER_CAMPAIGN_SECTION_ORDER,
  NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER,
  type NewsletterCampaignItemType,
} from '~~/shared/constants/newsletterCampaigns'
import { resolveLanguageTag } from '~~/shared/utils/locale'
import {
  getNewsletterEmailMessages,
  type NewsletterEmailMessageKey,
  type NewsletterEmailMessages,
} from '../locale/newsletterEmailMessages'
import { extractPlainText } from '../press/pressTranslation'
import {
  buildEmailButton,
  buildEmailDividerRow,
  buildEmailLayout,
  EMAIL_COLORS,
  EMAIL_FONTS,
  escapeHtml,
  escapeHtmlForAttribute,
} from './emailTemplates'

/**
 * One content block of the campaign email, already resolved to the recipient's locale from the
 * item snapshot. URLs arrive absolute: this module renders, it does not resolve or localize.
 */
export interface CampaignEmailItem {
  title: string
  excerpt: string | null
  /** Absolute URL. `null` renders the block without an `<img>` — no placeholder artwork. */
  imageUrl: string | null
  /** `null` marks the image as decorative (a default cover) and renders `alt=""`. */
  imageAlt: string | null
  dateLabel: string | null
  /** Absolute click-tracking URL. */
  clickUrl: string
}

export interface CampaignEmailSection {
  itemType: NewsletterCampaignItemType
  items: CampaignEmailItem[]
}

export interface CampaignEmailOptions {
  /** Internal locale code (`val`), not a BCP 47 tag. */
  localeCode: SupportedLocaleCode
  subject: string
  preheader: string | null
  /** Already sanitized with `sanitizeNewsletterIntroHtml` by the caller. */
  introHtml: string | null
  sections: CampaignEmailSection[]
  siteUrl: string
}

const SECTION_TITLE_KEYS: Record<NewsletterCampaignItemType, NewsletterEmailMessageKey> = {
  press: 'sectionPress',
  activity: 'sectionActivity',
  area_report: 'sectionAreaReport',
}

const READ_MORE_SUFFIX = ' →'

const TEXT_SEPARATOR = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

/**
 * Sections always follow `NEWSLETTER_CAMPAIGN_SECTION_ORDER`, whatever order the caller passed
 * them in. Empty sections are dropped so no heading is left without content.
 */
const orderCampaignSections = (sections: CampaignEmailSection[]): CampaignEmailSection[] =>
  NEWSLETTER_CAMPAIGN_SECTION_ORDER.flatMap((itemType) => {
    const items = sections
      .filter((section) => section.itemType === itemType)
      .flatMap((section) => section.items)

    return items.length > 0 ? [{ itemType, items }] : []
  })

const buildIntroRow = (introHtml: string | null) => {
  if (!introHtml) {
    return ''
  }

  return `<tr>
                  <td style="padding:20px 16px 4px 16px; font-family:${EMAIL_FONTS.body}; font-size:16px; line-height:26px; color:${EMAIL_COLORS.body};">
                    ${introHtml}
                  </td>
                </tr>`
}

const buildSectionHeadingRow = (title: string) => `<tr>
                  <td style="padding:24px 16px 4px 16px; font-family:${EMAIL_FONTS.heading}; font-size:20px; line-height:28px; font-weight:700; color:${EMAIL_COLORS.brand};">
                    ${escapeHtml(title)}
                  </td>
                </tr>`

const buildItemRow = (item: CampaignEmailItem, readMoreLabel: string) => {
  const clickUrl = escapeHtmlForAttribute(item.clickUrl)

  const imageBlock = item.imageUrl
    ? `<a href="${clickUrl}" style="text-decoration:none;">
                      <img src="${escapeHtmlForAttribute(item.imageUrl)}" alt="${item.imageAlt ? escapeHtmlForAttribute(item.imageAlt) : ''}" width="${NEWSLETTER_CAMPAIGN_IMAGE_WIDTH}"
                        style="display:block; width:${NEWSLETTER_CAMPAIGN_IMAGE_WIDTH}px; max-width:100%; height:auto; border-radius:6px; margin:0 0 12px 0;" />
                    </a>`
    : ''

  const dateBlock = item.dateLabel
    ? `<p style="margin:0 0 6px 0; font-family:${EMAIL_FONTS.body}; font-size:13px; line-height:18px; color:${EMAIL_COLORS.subtle};">${escapeHtml(item.dateLabel)}</p>`
    : ''

  const excerptBlock = item.excerpt
    ? `<p style="margin:0 0 16px 0; font-family:${EMAIL_FONTS.body}; font-size:15px; line-height:24px; color:${EMAIL_COLORS.muted};">${escapeHtml(item.excerpt)}</p>`
    : ''

  return `<tr>
                  <td style="padding:16px;">
                    ${imageBlock}
                    ${dateBlock}
                    <p style="margin:0 0 8px 0; font-family:${EMAIL_FONTS.heading}; font-size:18px; line-height:26px; font-weight:700;">
                      <a href="${clickUrl}" style="color:${EMAIL_COLORS.body}; text-decoration:none;">${escapeHtml(item.title)}</a>
                    </p>
                    ${excerptBlock}
                    <p style="margin:0;">
                      ${buildEmailButton(clickUrl, `${escapeHtml(readMoreLabel)}${READ_MORE_SUFFIX}`)}
                    </p>
                  </td>
                </tr>`
}

/**
 * The unsubscribe link is a fixed sentinel, never a per-recipient URL: one render is reused for
 * every subscriber of the locale and the mailer substitutes the signed URL on send. It is
 * inserted verbatim — running it through `escapeHtmlForAttribute` would break the substitution.
 */
const buildFooterRows = (messages: NewsletterEmailMessages) => `${buildEmailDividerRow()}
                <tr>
                  <td style="padding:16px; font-family:${EMAIL_FONTS.body}; font-size:12px; line-height:18px; color:${EMAIL_COLORS.subtle}; text-align:center;">
                    ${escapeHtml(messages.receptionReason)}
                    <br />
                    <a href="${NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER}" style="color:${EMAIL_COLORS.brand}; text-decoration:none;">${escapeHtml(messages.unsubscribe)}</a>
                  </td>
                </tr>`

export function buildCampaignEmailHtml(options: CampaignEmailOptions): string {
  const messages = getNewsletterEmailMessages(options.localeCode)
  const escapedSubject = escapeHtml(options.subject)

  const sectionRows = orderCampaignSections(options.sections)
    .map((section, index) => {
      const dividerRow = index > 0 ? buildEmailDividerRow('12px 16px 0 16px') : ''
      const headingRow = buildSectionHeadingRow(messages[SECTION_TITLE_KEYS[section.itemType]])
      const itemRows = section.items
        .map((item) => buildItemRow(item, messages.readMore))
        .join('\n                ')

      return `${dividerRow}
                ${headingRow}
                ${itemRows}`
    })
    .join('\n                ')

  return buildEmailLayout({
    bannerAlt: 'CREUP',
    heading: escapedSubject,
    lang: resolveLanguageTag(options.localeCode),
    preheader: options.preheader ? escapeHtml(options.preheader) : '',
    siteUrl: options.siteUrl,
    title: escapedSubject,
    innerHtml: `${buildIntroRow(options.introHtml)}
                ${sectionRows}
                ${buildFooterRows(messages)}`,
  })
}

export function buildCampaignEmailText(options: CampaignEmailOptions): string {
  const messages = getNewsletterEmailMessages(options.localeCode)
  const lines: string[] = [options.subject]

  if (options.preheader) {
    lines.push('', options.preheader)
  }

  // Derived from the sanitized intro, never from the raw admin HTML. `extractPlainText` reads
  // `textContent`, which would fuse adjacent blocks ("UnoDos"), so block boundaries get a space
  // first — the helper's own whitespace collapse normalizes it.
  const introText = extractPlainText(
    options.introHtml?.replace(/<\/p>|<br\s*\/?>/gi, '$& ') ?? null
  )
  if (introText) {
    lines.push('', introText)
  }

  for (const section of orderCampaignSections(options.sections)) {
    lines.push('', TEXT_SEPARATOR, messages[SECTION_TITLE_KEYS[section.itemType]], TEXT_SEPARATOR)

    for (const item of section.items) {
      lines.push('', item.title)

      if (item.dateLabel) {
        lines.push(item.dateLabel)
      }

      if (item.excerpt) {
        lines.push(item.excerpt)
      }

      lines.push(`${messages.readMore}: ${item.clickUrl}`)
    }
  }

  lines.push(
    '',
    TEXT_SEPARATOR,
    messages.receptionReason,
    `${messages.unsubscribe}: ${NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER}`,
    ''
  )

  return lines.join('\n')
}
