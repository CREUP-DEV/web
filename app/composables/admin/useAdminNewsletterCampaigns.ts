import type { Ref } from 'vue'
import type {
  NewsletterCampaignItemType,
  NewsletterCampaignStatus,
} from '~~/shared/constants/newsletterCampaigns'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

export interface AdminCampaignTranslation {
  locale: string
  subject: string
  preheader: string | null
  introHtml: string | null
}

export interface AdminCampaignItemTranslation {
  locale: string
  titleOverride: string | null
  excerptOverride: string | null
}

/** One locale's frozen view of an item. Present only once the campaign's send froze the snapshot. */
export interface AdminCampaignItemLocaleSnapshot {
  title: string
  excerpt: string | null
  imagePath: string | null
  imageAlt: string | null
  dateLabel: string | null
  targetPath: string
}

export interface AdminCampaignItemSnapshot {
  assetPaths: string[]
  locales: Record<string, AdminCampaignItemLocaleSnapshot>
}

export interface AdminCampaignItem {
  id: string
  position: number
  itemType: NewsletterCampaignItemType
  itemId: string
  clickCount: number
  /** Null while the campaign is a draft; frozen when the send is requested. */
  snapshot: AdminCampaignItemSnapshot | null
  translations: AdminCampaignItemTranslation[]
}

export interface AdminCampaignDeliveryStats {
  total: number
  queued: number
  sending: number
  sent: number
  failed: number
}

export interface AdminCampaign {
  id: string
  status: NewsletterCampaignStatus
  isSending: boolean
  sentAt: string | null
  createdAt: string
  updatedAt: string
  lastDeliveryStartedAt: string | null
  lastDeliveryFinishedAt: string | null
  lastDeliveryTotal: number | null
  lastDeliverySentCount: number | null
  lastDeliveryErrorCount: number | null
  lastDeliveryFailedRecipients: string[] | null
  unsubscribeCount: number
  translations: AdminCampaignTranslation[]
  items: AdminCampaignItem[]
  stats: {
    itemCount: number
    totalClicks: number
    unsubscribeCount: number
    delivery: AdminCampaignDeliveryStats
  }
}

/** Row of the campaign list: the same delivery counters, flattened, plus the Spanish subject. */
export interface AdminCampaignListItem {
  id: string
  status: NewsletterCampaignStatus
  subject: string | null
  isSending: boolean
  sentAt: string | null
  createdAt: string
  updatedAt: string
  lastDeliveryStartedAt: string | null
  lastDeliveryFinishedAt: string | null
  lastDeliveryTotal: number | null
  lastDeliverySentCount: number | null
  lastDeliveryErrorCount: number | null
  unsubscribeCount: number
  itemCount: number
  totalClicks: number
}

/** One selectable piece of published content, as returned by the content picker endpoint. */
export interface AdminCampaignContentEntry {
  itemType: NewsletterCampaignItemType
  itemId: string
  subtype: string | null
  title: string
  excerpt: string | null
  date: string
  /** Area reports only: the edition's first month when it spans more than its anchor month. */
  coversFrom?: string | null
  imageUrl: string | null
  /** The piece carries no summary of its own, so writing an override is recommended. */
  needsExcerptOverride: boolean
}

/** Machine codes the snapshot projection reports for a piece it could not freeze. */
export const CAMPAIGN_UNAVAILABLE_REASONS = ['missing', 'inactive'] as const

export type AdminCampaignUnavailableReason = (typeof CAMPAIGN_UNAVAILABLE_REASONS)[number]

/**
 * A piece the send refused to freeze, as listed by the 409 of the send endpoint. `reason` is a
 * machine code, so the wording is this panel's to supply.
 */
export interface AdminCampaignUnavailableItem {
  /** Row id of the campaign item, unique per campaign — usable as a list key. */
  id: string
  itemType: NewsletterCampaignItemType
  itemId: string
  reason: string
}

/**
 * One language whose rendered email exceeded the byte budget, as listed by the other 409 the send
 * can return. Measured per locale, so a campaign can be over the limit in one language only.
 */
export interface AdminCampaignOversizedLocale {
  locale: string
  bytes: number
  limit: number
}

export interface AdminCampaignListResponse {
  data: AdminCampaignListItem[]
  meta: { total: number }
}

interface AdminCampaignContentResponse {
  data: AdminCampaignContentEntry[]
  meta: { total: number }
}

export const CAMPAIGNS_API_BASE = '/api/admin/newsletter/campaigns'
export const CAMPAIGN_CONTENT_API = '/api/admin/newsletter/content'

export const campaignEditorPath = (id: string) => `${ADMIN_ROUTES.newsletterCampaigns}/${id}`

const STATUS_META: Record<
  NewsletterCampaignStatus,
  { color: 'neutral' | 'info' | 'primary' | 'success' | 'warning' | 'error'; icon: string }
> = {
  draft: { color: 'neutral', icon: 'i-tabler-pencil' },
  queued: { color: 'info', icon: 'i-tabler-clock' },
  sending: { color: 'primary', icon: 'i-tabler-send' },
  sent: { color: 'success', icon: 'i-tabler-circle-check' },
  // Not "failed": the run reached almost everyone and only some deliveries are outstanding.
  failed: { color: 'warning', icon: 'i-tabler-alert-triangle' },
  paused: { color: 'warning', icon: 'i-tabler-player-pause' },
}

const ITEM_TYPE_ICONS: Record<NewsletterCampaignItemType, string> = {
  press: 'i-tabler-news',
  activity: 'i-tabler-calendar-event',
  area_report: 'i-tabler-report',
}

/** Sub-kinds the content endpoint reports raw, per item type. Area reports have none. */
const ITEM_SUBTYPES = ['press_release', 'statement', 'media_appearance', 'creup', 'member']

const MONTH_ONLY_DATE = /^\d{4}-\d{2}$/

/** Status labels, badge colours and item-type icons — shared by the list, the editor and the detail. */
export function useAdminCampaignPresentation() {
  const { t } = useI18n()
  const { formatDate } = useLocaleFormatting()

  const statusLabel = (status: NewsletterCampaignStatus) =>
    t(`admin.newsletterCampaigns.status.${status}`)

  const statusColor = (status: NewsletterCampaignStatus) => STATUS_META[status].color
  const statusIcon = (status: NewsletterCampaignStatus) => STATUS_META[status].icon

  const itemTypeLabel = (itemType: NewsletterCampaignItemType) =>
    t(`admin.newsletterCampaigns.itemTypes.${itemType}`)

  const itemTypeIcon = (itemType: NewsletterCampaignItemType) => ITEM_TYPE_ICONS[itemType]

  const subtypeLabel = (subtype: string | null) =>
    subtype && ITEM_SUBTYPES.includes(subtype)
      ? t(`admin.newsletterCampaigns.subtypes.${subtype}`)
      : null

  /** Area-report dates are the edition's anchor month (`YYYY-MM`); the other two are full dates. */
  const formatEntryDate = (date: string) =>
    MONTH_ONLY_DATE.test(date)
      ? formatDate(`${date}-01`, { year: 'numeric', month: 'long' })
      : formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' })

  /** `missing` and `inactive` arrive as machine codes; anything else falls back to a generic line. */
  const unavailableReasonLabel = (reason: string) =>
    (CAMPAIGN_UNAVAILABLE_REASONS as readonly string[]).includes(reason)
      ? t(`admin.newsletterCampaigns.unavailableReason.${reason}`)
      : t('admin.newsletterCampaigns.unavailableReason.unknown')

  return {
    statusLabel,
    statusColor,
    statusIcon,
    itemTypeLabel,
    itemTypeIcon,
    subtypeLabel,
    formatEntryDate,
    unavailableReasonLabel,
  }
}

/**
 * Pulls the piece list out of a rejected campaign send. The 409 body is
 * `{ message, data: { unavailable: [...] } }`; the editor needs it per piece, not flattened into
 * one sentence, so each entry can be matched back to the row it belongs to.
 */
export function extractUnavailableCampaignItems(error: unknown): AdminCampaignUnavailableItem[] {
  const body = (error as { data?: { data?: { unavailable?: unknown } } } | null)?.data?.data
    ?.unavailable

  if (!Array.isArray(body)) {
    return []
  }

  return body.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const { id, itemType, itemId, reason } = entry as Record<string, unknown>

    if (typeof itemType !== 'string' || typeof itemId !== 'string') {
      return []
    }

    return [
      {
        id: typeof id === 'string' ? id : `${itemType}:${itemId}`,
        itemType: itemType as NewsletterCampaignItemType,
        itemId,
        reason: typeof reason === 'string' ? reason : '',
      },
    ]
  })
}

/**
 * The send's other structured 409: `{ message, data: { oversized: [{ locale, bytes, limit }] } }`.
 * Reported per language, so the editor can say which one to shorten instead of "the email is
 * too big".
 */
export function extractOversizedCampaignLocales(error: unknown): AdminCampaignOversizedLocale[] {
  const body = (error as { data?: { data?: { oversized?: unknown } } } | null)?.data?.data
    ?.oversized

  if (!Array.isArray(body)) {
    return []
  }

  return body.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const { locale, bytes, limit } = entry as Record<string, unknown>

    if (typeof locale !== 'string') {
      return []
    }

    return [
      {
        locale,
        bytes: typeof bytes === 'number' ? bytes : 0,
        limit: typeof limit === 'number' ? limit : 0,
      },
    ]
  })
}

/** List layer for `/admin/newsletter`: fetch, pagination and the poll that follows a live send. */
export function useAdminCampaignList() {
  const localeApiHeaders = useLocaleApiHeaders()

  const page = ref(1)
  const pageSize = 20

  const { data, error, pending, refresh } = useFetch<AdminCampaignListResponse>(
    CAMPAIGNS_API_BASE,
    {
      headers: localeApiHeaders,
      lazy: true,
      query: computed(() => ({ limit: pageSize, offset: (page.value - 1) * pageSize })),
    }
  )

  const { items, removeItem, prependItem, updateMeta } = useAdminMutableCollection<
    AdminCampaignListItem,
    { total: number }
  >(data)

  const total = computed(() => data.value?.meta?.total ?? 0)
  const pageCount = computed(() => Math.ceil(total.value / pageSize))

  useCampaignSendPolling(
    computed(() =>
      items.value.some((item) => item.status === 'queued' || item.status === 'sending')
    ),
    refresh
  )

  return {
    data,
    error,
    pending,
    refresh,
    items,
    removeItem,
    prependItem,
    updateMeta,
    total,
    page,
    pageSize,
    pageCount,
  }
}

/** Refreshes every 10s while a campaign is mid-send, so the counters advance without a reload. */
export function useCampaignSendPolling(isActive: Ref<boolean>, refresh: () => unknown) {
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    timer = setInterval(() => {
      if (isActive.value) {
        void refresh()
      }
    }, 10_000)
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })
}

/**
 * Content picker data source. `ids` resolves the pieces a saved draft already holds; without it the
 * query is the browse/search listing. Anything the endpoint does not return is treated as
 * unavailable by the caller, which is also what a deleted or unpublished piece looks like.
 */
export function useAdminCampaignContent() {
  const localeApiHeaders = useLocaleApiHeaders()

  const fetchContent = (query: {
    type: NewsletterCampaignItemType
    q?: string
    sinceLastCampaign?: boolean
    /** Sub-kinds to keep. Omitted means every sub-kind of the requested type. */
    subtypes?: string[]
    limit?: number
    offset?: number
  }) =>
    $fetch<AdminCampaignContentResponse>(CAMPAIGN_CONTENT_API, {
      headers: localeApiHeaders.value,
      query: {
        type: query.type,
        ...(query.q ? { q: query.q } : {}),
        ...(query.sinceLastCampaign ? { sinceLastCampaign: 'true' } : {}),
        ...(query.subtypes?.length ? { subtypes: query.subtypes.join(',') } : {}),
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
      },
    })

  const fetchContentByIds = async (idsByType: Map<NewsletterCampaignItemType, string[]>) => {
    const responses = await Promise.all(
      [...idsByType.entries()].map(([type, ids]) =>
        ids.length
          ? $fetch<AdminCampaignContentResponse>(CAMPAIGN_CONTENT_API, {
              headers: localeApiHeaders.value,
              query: { type, ids: ids.join(','), limit: Math.min(ids.length, 100) },
            }).catch(() => ({ data: [], meta: { total: 0 } }) as AdminCampaignContentResponse)
          : Promise.resolve({ data: [], meta: { total: 0 } } as AdminCampaignContentResponse)
      )
    )

    const byKey = new Map<string, AdminCampaignContentEntry>()

    for (const response of responses) {
      for (const entry of response.data) {
        byKey.set(`${entry.itemType}:${entry.itemId}`, entry)
      }
    }

    return byKey
  }

  return { fetchContent, fetchContentByIds }
}
