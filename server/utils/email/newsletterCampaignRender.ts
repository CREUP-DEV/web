import { db } from '../../db'
import type {
  NewsletterCampaignItemLocaleSnapshot,
  NewsletterCampaignItemSnapshot,
} from '../../db/schema/newsletterCampaigns'
import { loadNewsletterCampaign } from '../newsletter/newsletterCampaigns'
import { projectCampaignItems } from '../newsletter/campaignSnapshot'
import {
  createNewsletterAttributionSignature,
  createNewsletterUnsubscribeToken,
} from '../newsletter/newsletterSubscribers'
import { buildAbsoluteUrl } from '../core/urlBuilder'
import {
  buildCampaignEmailHtml,
  buildCampaignEmailText,
  type CampaignEmailItem,
  type CampaignEmailSection,
} from './newsletterCampaignTemplate'
import {
  buildNewsletterClickPath,
  NEWSLETTER_CAMPAIGN_MAX_HTML_BYTES,
  NEWSLETTER_CAMPAIGN_SECTION_ORDER,
  NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER,
  type NewsletterCampaignItemType,
} from '~~/shared/constants/newsletterCampaigns'
import { DEFAULT_LOCALE_CODE, LOCALE_DEFINITIONS } from '~~/shared/constants/locales'
import type { SupportedLocaleCode } from '~~/shared/constants/locales'
import {
  buildLocalizedPathFromLocale,
  pickLocalizedEntryWithFieldFallback,
  resolveLocaleCode,
  SUPPORTED_LOCALE_CODES,
} from '~~/shared/utils/locale'

/**
 * Turns a campaign into the rendered email, once per locale.
 *
 * The same functions serve the mailer, the preview and the test send, which is the point: a preview
 * rendered by anything else would drift from what subscribers receive. What varies between them is
 * only how links are built and what the unsubscribe sentinel becomes.
 */

export const NEWSLETTER_UNSUBSCRIBE_PAGE_PATH = '/desuscribirse'
export const NEWSLETTER_UNSUBSCRIBE_ENDPOINT_PATH = '/api/newsletter-unsubscribe'

/** Length of a cuid2 identifier, used to size the sample unsubscribe URL of the byte check. */
const SAMPLE_SUBSCRIBER_ID = 'c'.repeat(24)

/** The locale helpers take a mutable list; `LOCALE_DEFINITIONS` is a readonly tuple. */
const LOCALE_LIST = [...LOCALE_DEFINITIONS]

export interface CampaignRenderTranslation {
  locale: string
  subject: string
  preheader: string | null
  introHtml: string | null
}

export interface CampaignRenderItem {
  /** `newsletter_campaign_items.id` — what the click route counts against. */
  id: string
  itemType: NewsletterCampaignItemType
  snapshot: NewsletterCampaignItemSnapshot
}

export interface CampaignRenderContext {
  campaignId: string
  siteUrl: string
  translations: CampaignRenderTranslation[]
  items: CampaignRenderItem[]
  /**
   * `tracked` routes every link through the click counter; `direct` goes straight to the localized
   * target. Preview and test sends use `direct` so looking at an email never moves a metric.
   */
  links: 'tracked' | 'direct'
  /**
   * Replaces the unsubscribe sentinel at render time. `null` leaves the sentinel in place so one
   * render can be reused for every subscriber of the locale and the mailer substitutes per
   * recipient.
   */
  unsubscribeUrl: string | null
}

export interface RenderedCampaignEmail {
  subject: string
  html: string
  text: string
}

export function resolveCampaignLocaleCode(value: string | null | undefined): SupportedLocaleCode {
  const resolved = resolveLocaleCode(value, LOCALE_LIST, DEFAULT_LOCALE_CODE)

  return SUPPORTED_LOCALE_CODES.includes(resolved as SupportedLocaleCode)
    ? (resolved as SupportedLocaleCode)
    : DEFAULT_LOCALE_CODE
}

/**
 * The three per-recipient URLs of an unsubscribe, from the same signed parameters.
 *
 * The visible footer link goes to the page a person reads; `List-Unsubscribe` points at the API
 * route instead, because the one-click POST is made by the mail provider, not by a human.
 */
export function buildCampaignUnsubscribeUrls(options: {
  siteUrl: string
  campaignId: string
  subscriberId: string
  subscribedAt: Date | string
}) {
  const token = createNewsletterUnsubscribeToken(options.subscriberId, options.subscribedAt)
  const attribution = createNewsletterAttributionSignature(
    options.subscriberId,
    options.campaignId,
    options.subscribedAt
  )
  const query = `token=${encodeURIComponent(token)}&c=${encodeURIComponent(
    options.campaignId
  )}&a=${encodeURIComponent(attribution)}`

  return {
    visible: buildAbsoluteUrl(options.siteUrl, `${NEWSLETTER_UNSUBSCRIBE_PAGE_PATH}?${query}`),
    oneClick: buildAbsoluteUrl(options.siteUrl, `${NEWSLETTER_UNSUBSCRIBE_ENDPOINT_PATH}?${query}`),
  }
}

/** Substitutes the sentinel in both bodies. The plain-text part carries it too. */
export function applyCampaignUnsubscribeUrl(
  rendered: RenderedCampaignEmail,
  unsubscribeUrl: string
): RenderedCampaignEmail {
  return {
    subject: rendered.subject,
    html: rendered.html.replaceAll(NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER, unsubscribeUrl),
    text: rendered.text.replaceAll(NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER, unsubscribeUrl),
  }
}

function buildClickUrl(
  context: CampaignRenderContext,
  item: CampaignRenderItem,
  localeCode: SupportedLocaleCode,
  target: NewsletterCampaignItemLocaleSnapshot
) {
  if (context.links === 'tracked') {
    return buildAbsoluteUrl(
      context.siteUrl,
      buildNewsletterClickPath(context.campaignId, item.id, localeCode)
    )
  }

  // `buildLocalizedPathFromLocale`, not `buildLocalizedPath`: there is no request locale to read
  // here, and the snapshot stores the path without a language prefix.
  return buildAbsoluteUrl(
    context.siteUrl,
    buildLocalizedPathFromLocale(target.targetPath, localeCode, LOCALE_LIST, DEFAULT_LOCALE_CODE)
  )
}

function buildSections(
  context: CampaignRenderContext,
  localeCode: SupportedLocaleCode
): CampaignEmailSection[] {
  const itemsByType = new Map<NewsletterCampaignItemType, CampaignEmailItem[]>()

  for (const item of context.items) {
    const target =
      item.snapshot.locales?.[localeCode] ?? item.snapshot.locales?.[DEFAULT_LOCALE_CODE]

    if (!target) {
      continue
    }

    if (!itemsByType.has(item.itemType)) {
      itemsByType.set(item.itemType, [])
    }

    itemsByType.get(item.itemType)!.push({
      title: target.title,
      excerpt: target.excerpt,
      imageUrl: target.imagePath ? buildAbsoluteUrl(context.siteUrl, target.imagePath) : null,
      imageAlt: target.imageAlt,
      dateLabel: target.dateLabel,
      clickUrl: buildClickUrl(context, item, localeCode, target),
    })
  }

  return NEWSLETTER_CAMPAIGN_SECTION_ORDER.flatMap((itemType) => {
    const items = itemsByType.get(itemType)
    return items?.length ? [{ itemType, items }] : []
  })
}

export function renderCampaignEmail(
  context: CampaignRenderContext,
  localeCode: SupportedLocaleCode
): RenderedCampaignEmail {
  const translation = pickLocalizedEntryWithFieldFallback(
    context.translations,
    localeCode,
    LOCALE_LIST,
    DEFAULT_LOCALE_CODE
  )
  const options = {
    localeCode,
    subject: translation?.subject?.trim() ?? '',
    preheader: translation?.preheader?.trim() || null,
    introHtml: translation?.introHtml || null,
    sections: buildSections(context, localeCode),
    siteUrl: context.siteUrl,
  }

  const rendered: RenderedCampaignEmail = {
    subject: options.subject,
    html: buildCampaignEmailHtml(options),
    text: buildCampaignEmailText(options),
  }

  return context.unsubscribeUrl
    ? applyCampaignUnsubscribeUrl(rendered, context.unsubscribeUrl)
    : rendered
}

/**
 * Renders on demand and keeps one result per locale for the whole execution.
 *
 * Deliberately created once per run and not per batch: `processNewsletterCampaignDeliveryRun`
 * builds a fresh `pLimit` for every batch, and a cache living inside that loop would re-render all
 * six locales on each pass.
 */
export function createCampaignEmailRenderer(context: CampaignRenderContext) {
  const cache = new Map<SupportedLocaleCode, RenderedCampaignEmail>()

  return (localeCode: SupportedLocaleCode): RenderedCampaignEmail => {
    const cached = cache.get(localeCode)

    if (cached) {
      return cached
    }

    const rendered = renderCampaignEmail(context, localeCode)
    cache.set(localeCode, rendered)

    return rendered
  }
}

/**
 * Size of the HTML actually delivered, in bytes.
 *
 * Measured after substituting the sentinel for an unsubscribe URL of realistic maximum length —
 * signed token, campaign id and attribution HMAC — because those few hundred bytes are the margin
 * being measured. `Buffer.byteLength` and not `String.length`: Gmail clips on bytes, and Spanish
 * copy is full of multi-byte characters.
 */
export function measureCampaignHtmlBytes(context: CampaignRenderContext, html: string) {
  const sampleUrl = buildCampaignUnsubscribeUrls({
    siteUrl: context.siteUrl,
    campaignId: context.campaignId,
    subscriberId: SAMPLE_SUBSCRIBER_ID,
    subscribedAt: new Date(),
  }).visible

  return Buffer.byteLength(
    html.replaceAll(NEWSLETTER_UNSUBSCRIBE_URL_PLACEHOLDER, sampleUrl),
    'utf8'
  )
}

export interface OversizedCampaignLocale {
  locale: SupportedLocaleCode
  bytes: number
  limit: number
}

/** Every locale is measured: they do not all weigh the same. */
export function findOversizedCampaignLocales(
  context: CampaignRenderContext
): OversizedCampaignLocale[] {
  const oversized: OversizedCampaignLocale[] = []

  for (const localeCode of SUPPORTED_LOCALE_CODES) {
    const bytes = measureCampaignHtmlBytes(context, renderCampaignEmail(context, localeCode).html)

    if (bytes > NEWSLETTER_CAMPAIGN_MAX_HTML_BYTES) {
      oversized.push({ locale: localeCode, bytes, limit: NEWSLETTER_CAMPAIGN_MAX_HTML_BYTES })
    }
  }

  return oversized
}

export interface CampaignRenderContextInput {
  campaignId: string
  siteUrl: string
  links: CampaignRenderContext['links']
  unsubscribeUrl: string | null
  translations: CampaignRenderTranslation[]
  items: Array<{
    id: string
    itemType: string
    snapshot: NewsletterCampaignItemSnapshot | null
  }>
}

/** Items without a snapshot cannot be rendered, so they are dropped rather than half-drawn. */
export function buildCampaignRenderContext(
  input: CampaignRenderContextInput
): CampaignRenderContext {
  return {
    campaignId: input.campaignId,
    siteUrl: input.siteUrl,
    links: input.links,
    unsubscribeUrl: input.unsubscribeUrl,
    translations: input.translations,
    items: input.items.flatMap((item) =>
      item.snapshot
        ? [
            {
              id: item.id,
              itemType: item.itemType as NewsletterCampaignItemType,
              snapshot: item.snapshot,
            },
          ]
        : []
    ),
  }
}

export interface LoadCampaignRenderContextOptions {
  campaignId: string
  siteUrl: string
  links: CampaignRenderContext['links']
  unsubscribeUrl: string | null
  /**
   * Projects the referenced content live instead of reading the frozen snapshot. Only for drafts,
   * which have no snapshot yet: a sent campaign must always render exactly what was frozen.
   */
  projectLive?: boolean
}

export async function loadCampaignRenderContext(
  options: LoadCampaignRenderContextOptions
): Promise<CampaignRenderContext | null> {
  const campaign = await loadNewsletterCampaign(options.campaignId)

  if (!campaign) {
    return null
  }

  let snapshots: Map<string, NewsletterCampaignItemSnapshot> | null = null

  if (options.projectLive && campaign.items.length > 0) {
    // Read-only transaction: `projectCampaignItems` takes FOR SHARE locks and must hold them until
    // it has read everything it projects.
    const projection = await db.transaction(async (tx) =>
      projectCampaignItems(
        tx,
        campaign.items.map((item) => ({
          id: item.id,
          itemType: item.itemType as NewsletterCampaignItemType,
          itemId: item.itemId,
          overrides: item.translations.map((translation) => ({
            locale: translation.locale,
            titleOverride: translation.titleOverride,
            excerptOverride: translation.excerptOverride,
          })),
        }))
      )
    )

    snapshots = projection.snapshots
  }

  return buildCampaignRenderContext({
    campaignId: campaign.id,
    siteUrl: options.siteUrl,
    links: options.links,
    unsubscribeUrl: options.unsubscribeUrl,
    translations: campaign.translations,
    items: campaign.items.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      snapshot: snapshots ? (snapshots.get(item.id) ?? null) : item.snapshot,
    })),
  })
}
