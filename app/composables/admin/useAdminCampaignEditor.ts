import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'
import { hasMeaningfulHtml } from '~~/shared/utils/richText'
import type { NewsletterCampaignItemType } from '~~/shared/constants/newsletterCampaigns'
import type {
  AdminCampaign,
  AdminCampaignContentEntry,
  AdminCampaignItemTranslation,
  AdminCampaignTranslation,
} from '@/composables/admin/useAdminNewsletterCampaigns'
import { CAMPAIGNS_API_BASE } from '@/composables/admin/useAdminNewsletterCampaigns'

export interface CampaignEditorTranslation extends AdminCampaignTranslation {
  preheader: string
  introHtml: string
}

/** Form shape of an override row: empty strings rather than nulls, so inputs bind directly. */
export interface CampaignEditorItemTranslation {
  locale: string
  titleOverride: string
  excerptOverride: string
}

/**
 * One row of the content list. `entry` carries what the card renders; it is null when the piece no
 * longer comes back from the content endpoint — deleted or unpublished — which is the same reason
 * the send would refuse it, surfaced here where there is still someone to warn.
 */
export interface CampaignEditorItem {
  key: string
  itemType: NewsletterCampaignItemType
  itemId: string
  entry: AdminCampaignContentEntry | null
  translations: CampaignEditorItemTranslation[]
}

export const campaignItemKey = (itemType: string, itemId: string) => `${itemType}:${itemId}`

const trimmedOrNull = (value: string | null | undefined) => value?.trim() || null

/**
 * Draft editing state for one campaign: the per-locale texts, the ordered content list and the two
 * saves they map onto.
 *
 * Texts and items are two endpoints but one optimistic lock — both take the campaign's `updatedAt`
 * and both bump it. They are therefore saved in sequence, re-seeding `updatedAt` from each
 * response; firing them together would make the second one lose to the first.
 */
export function useAdminCampaignEditor(campaign: Ref<AdminCampaign | null>) {
  const { createEmptyTranslations, localeConfigs } = useLocales()
  const { fetchContentByIds } = useAdminCampaignContent()

  const translations = ref<CampaignEditorTranslation[]>([])
  const items = ref<CampaignEditorItem[]>([])
  const updatedAt = ref<string | null>(null)
  const isResolvingItems = ref(false)

  const buildItemTranslations = (
    existing: AdminCampaignItemTranslation[] = []
  ): CampaignEditorItemTranslation[] =>
    localeConfigs.value.map((config) => {
      const match = existing.find((translation) => translation.locale === config.code)

      return {
        locale: config.code,
        titleOverride: match?.titleOverride ?? '',
        excerptOverride: match?.excerptOverride ?? '',
      }
    })

  const emptyEditorTranslations = () =>
    createEmptyTranslations<CampaignEditorTranslation>({
      subject: '',
      preheader: '',
      introHtml: '',
    })

  /**
   * Loads campaign data into the form. Item display data is not resolved here: that call needs the
   * admin session cookie, so it belongs to the client (`resolveItemEntries`, from `onMounted`).
   */
  const hydrate = () => {
    const source = campaign.value

    if (!source) {
      translations.value = emptyEditorTranslations()
      items.value = []
      return
    }

    updatedAt.value = source.updatedAt

    translations.value = localeConfigs.value.map((config) => {
      const existing = source.translations.find((translation) => translation.locale === config.code)

      return {
        locale: config.code,
        subject: existing?.subject ?? '',
        preheader: existing?.preheader ?? '',
        introHtml: existing?.introHtml ?? '',
      }
    })

    items.value = source.items.map((item) => ({
      key: campaignItemKey(item.itemType, item.itemId),
      itemType: item.itemType,
      itemId: item.itemId,
      entry: null,
      translations: buildItemTranslations(item.translations),
    }))

    // Cards stay in their loading state until the client resolves them, so a saved draft never
    // flashes every piece as unavailable on the way in.
    isResolvingItems.value = items.value.length > 0
  }

  /** Fills `entry` on every row from the content endpoint, one request per type present. */
  const resolveItemEntries = async () => {
    if (!items.value.length) {
      return
    }

    isResolvingItems.value = true

    try {
      const idsByType = new Map<NewsletterCampaignItemType, string[]>()

      for (const item of items.value) {
        const ids = idsByType.get(item.itemType)

        if (ids) {
          ids.push(item.itemId)
        } else {
          idsByType.set(item.itemType, [item.itemId])
        }
      }

      const entries = await fetchContentByIds(idsByType)

      items.value = items.value.map((item) => ({
        ...item,
        entry: entries.get(item.key) ?? null,
      }))
    } finally {
      isResolvingItems.value = false
    }
  }

  const hasItem = (itemType: string, itemId: string) =>
    items.value.some((item) => item.key === campaignItemKey(itemType, itemId))

  const addEntries = (entries: AdminCampaignContentEntry[]) => {
    const added: CampaignEditorItem[] = []

    for (const entry of entries) {
      if (hasItem(entry.itemType, entry.itemId)) {
        continue
      }

      added.push({
        key: campaignItemKey(entry.itemType, entry.itemId),
        itemType: entry.itemType,
        itemId: entry.itemId,
        entry,
        translations: buildItemTranslations(),
      })
    }

    if (added.length) {
      items.value = [...items.value, ...added]
    }

    return added.length
  }

  const removeItemAt = (index: number) => {
    items.value = items.value.filter((_, position) => position !== index)
  }

  const removeItemByKey = (key: string) => {
    items.value = items.value.filter((item) => item.key !== key)
  }

  /** Returns the new index, or null when the move would fall off the list. */
  const moveItem = (index: number, offset: number) => {
    const target = index + offset

    if (target < 0 || target >= items.value.length) {
      return null
    }

    const next = [...items.value]
    const [moved] = next.splice(index, 1)

    if (!moved) {
      return null
    }

    next.splice(target, 0, moved)
    items.value = next

    return target
  }

  const setOrder = (keys: string[]) => {
    const byKey = new Map(items.value.map((item) => [item.key, item]))
    const reordered = keys.flatMap((key) => {
      const item = byKey.get(key)
      return item ? [item] : []
    })

    if (reordered.length === items.value.length) {
      items.value = reordered
    }
  }

  /**
   * Optional locales only travel when they carry a subject: an entry without one would be stored as
   * an empty subject rather than falling back to Spanish. The editor blocks that case first, so a
   * dropped row here never loses text the admin wrote.
   */
  const buildTranslationsPayload = () =>
    translations.value
      .filter(
        (translation) =>
          translation.locale === DEFAULT_LOCALE_CODE || translation.subject.trim().length > 0
      )
      .map((translation) => ({
        locale: translation.locale,
        subject: translation.subject.trim(),
        preheader: trimmedOrNull(translation.preheader),
        introHtml: hasMeaningfulHtml(translation.introHtml) ? translation.introHtml : null,
      }))

  const buildItemsPayload = () =>
    items.value.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      translations: item.translations
        .map((translation) => ({
          locale: translation.locale,
          titleOverride: trimmedOrNull(translation.titleOverride),
          excerptOverride: trimmedOrNull(translation.excerptOverride),
        }))
        .filter(
          (translation) =>
            translation.titleOverride !== null || translation.excerptOverride !== null
        ),
    }))

  /** Full validation payload: every locale, unfiltered, so a half-filled one can be flagged. */
  const buildTextsValidationPayload = () => ({
    translations: translations.value.map((translation) => ({
      locale: translation.locale,
      subject: translation.subject.trim(),
      preheader: trimmedOrNull(translation.preheader),
      introHtml: hasMeaningfulHtml(translation.introHtml) ? translation.introHtml : null,
    })),
  })

  const buildSnapshot = () =>
    JSON.stringify({ texts: buildTranslationsPayload(), items: buildItemsPayload() })

  const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildSnapshot)

  const applyCampaign = (next: AdminCampaign) => {
    updatedAt.value = next.updatedAt
  }

  /** Texts first, then items with the timestamp the first save returned. */
  const save = async () => {
    const textsResponse = await $fetch<{ data: AdminCampaign }>(
      `${CAMPAIGNS_API_BASE}/${campaign.value?.id}`,
      {
        method: 'PUT',
        body: { translations: buildTranslationsPayload(), updatedAt: updatedAt.value },
      }
    )

    applyCampaign(textsResponse.data)

    const itemsResponse = await $fetch<{ data: AdminCampaign }>(
      `${CAMPAIGNS_API_BASE}/${campaign.value?.id}/items`,
      {
        method: 'PUT',
        body: { items: buildItemsPayload(), updatedAt: updatedAt.value },
      }
    )

    applyCampaign(itemsResponse.data)
    resetFormSnapshot()

    return itemsResponse.data
  }

  return {
    translations,
    items,
    updatedAt,
    isResolvingItems,
    hasFormChanges,
    hydrate,
    resolveItemEntries,
    addEntries,
    hasItem,
    removeItemAt,
    removeItemByKey,
    moveItem,
    setOrder,
    buildTextsValidationPayload,
    buildItemsPayload,
    resetFormSnapshot,
    applyCampaign,
    save,
  }
}
