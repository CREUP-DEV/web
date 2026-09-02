<script setup lang="ts">
import { NEWSLETTER_CAMPAIGN_ITEM_TYPES } from '~~/shared/constants/newsletterCampaigns'
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'
import { ACTIVITY_KINDS } from '~~/shared/constants/activity'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import type { NewsletterCampaignItemType } from '~~/shared/constants/newsletterCampaigns'
import type { AdminCampaignContentEntry } from '@/composables/admin/useAdminNewsletterCampaigns'
import { campaignItemKey } from '@/composables/admin/useAdminCampaignEditor'

const props = defineProps<{
  /** Keys already in the campaign, so an entry can be shown as taken instead of added twice. */
  existingKeys: string[]
}>()

const emit = defineEmits<{
  add: [entries: AdminCampaignContentEntry[]]
}>()

const open = defineModel<boolean>('open', { required: true })

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const { t } = useI18n()
const toast = useAdminToast()
const { fetchContent } = useAdminCampaignContent()
const { itemTypeLabel, itemTypeIcon, subtypeLabel, formatEntryDate } =
  useAdminCampaignPresentation()
const { formatEditionLabel } = useActivityDates()

const activeType = ref<NewsletterCampaignItemType>('press')
const search = ref('')
const debouncedSearch = ref('')
const sinceLastCampaign = ref(false)
const selectedSubtypes = ref<string[]>([])
const page = ref(1)

/** Press articles and activity entries have sub-kinds worth filtering by; area reports do not. */
const availableSubtypes = computed<readonly string[]>(() =>
  activeType.value === 'press'
    ? PRESS_ARTICLE_TYPES
    : activeType.value === 'activity'
      ? ACTIVITY_KINDS
      : []
)

const toggleSubtype = (subtype: string) => {
  selectedSubtypes.value = selectedSubtypes.value.includes(subtype)
    ? selectedSubtypes.value.filter((entry) => entry !== subtype)
    : [...selectedSubtypes.value, subtype]
}

const entries = ref<AdminCampaignContentEntry[]>([])
const total = ref(0)
const isLoading = ref(false)
const loadError = ref(false)
const selected = ref<Set<string>>(new Set())

const tabPanelId = 'campaign-content-results'

const existing = computed(() => new Set(props.existingKeys))
const pageCount = computed(() => Math.ceil(total.value / PAGE_SIZE))
const selectedCount = computed(() => selected.value.size)

let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value.trim()
  }, SEARCH_DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

const load = async () => {
  isLoading.value = true
  loadError.value = false

  try {
    const response = await fetchContent({
      type: activeType.value,
      q: debouncedSearch.value || undefined,
      sinceLastCampaign: sinceLastCampaign.value,
      subtypes: selectedSubtypes.value.length ? selectedSubtypes.value : undefined,
      limit: PAGE_SIZE,
      offset: (page.value - 1) * PAGE_SIZE,
    })

    entries.value = response.data
    total.value = response.meta.total
  } catch (error) {
    loadError.value = true
    entries.value = []
    total.value = 0
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletterCampaigns.picker.loadError')),
      color: 'error',
    })
  } finally {
    isLoading.value = false
  }
}

// Any change to the query resets to the first page; the page itself triggers the reload.
watch(activeType, () => {
  selectedSubtypes.value = []
})

watch([activeType, debouncedSearch, sinceLastCampaign, selectedSubtypes], () => {
  if (page.value === 1) {
    void load()
    return
  }

  page.value = 1
})

watch(page, () => {
  void load()
})

watch(open, (isOpen) => {
  if (!isOpen) return

  selected.value = new Set()
  void load()
})

const toggleEntry = (entry: AdminCampaignContentEntry) => {
  const key = campaignItemKey(entry.itemType, entry.itemId)
  const next = new Set(selected.value)

  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  selected.value = next
}

const selectedEntries = ref<Map<string, AdminCampaignContentEntry>>(new Map())

// The selection survives paging and tab changes, so the chosen entries are remembered separately
// from the page currently on screen.
watch(selected, (keys) => {
  const next = new Map(selectedEntries.value)

  for (const [key] of next) {
    if (!keys.has(key)) next.delete(key)
  }

  for (const entry of entries.value) {
    const key = campaignItemKey(entry.itemType, entry.itemId)
    if (keys.has(key)) next.set(key, entry)
  }

  selectedEntries.value = next
})

const isSelected = (entry: AdminCampaignContentEntry) =>
  selected.value.has(campaignItemKey(entry.itemType, entry.itemId))

const isTaken = (entry: AdminCampaignContentEntry) =>
  existing.value.has(campaignItemKey(entry.itemType, entry.itemId))

const selectableEntries = computed(() => entries.value.filter((entry) => !isTaken(entry)))

/**
 * Turns "everything taken on since the last send" into two clicks: filter, then take the lot.
 * Only the page on screen, so the count in the footer always matches what was actually picked.
 */
const selectAllVisible = () => {
  selectEntries(selectableEntries.value)
}

const selectEntries = (target: AdminCampaignContentEntry[]) => {
  const next = new Set(selected.value)

  for (const entry of target) {
    if (isTaken(entry)) continue
    next.add(campaignItemKey(entry.itemType, entry.itemId))
  }

  selected.value = next
}

/**
 * Area reports arrive one row per area per edition, ordered by edition, so a month's worth of them
 * reads as an undifferentiated run. Grouping gives each edition a heading and, more usefully, a
 * control that takes every area of that month at once — which is how these are actually chosen.
 * The other two types stay a single unheaded group.
 */
interface EntryGroup {
  key: string
  label: string | null
  entries: AdminCampaignContentEntry[]
  selectableCount: number
  allSelected: boolean
}

const entryGroups = computed<EntryGroup[]>(() => {
  if (activeType.value !== 'area_report') {
    return entries.value.length
      ? [
          {
            key: 'all',
            label: null,
            entries: entries.value,
            selectableCount: 0,
            allSelected: false,
          },
        ]
      : []
  }

  const groups = new Map<string, AdminCampaignContentEntry[]>()

  for (const entry of entries.value) {
    const bucket = groups.get(entry.date)
    if (bucket) bucket.push(entry)
    else groups.set(entry.date, [entry])
  }

  return [...groups].map(([monthKey, groupEntries]) => {
    const selectable = groupEntries.filter((entry) => !isTaken(entry))

    return {
      key: monthKey,
      label: formatEditionLabel({
        monthKey,
        coversFrom: groupEntries[0]?.coversFrom ?? null,
      }),
      entries: groupEntries,
      selectableCount: selectable.length,
      allSelected: selectable.length > 0 && selectable.every((entry) => isSelected(entry)),
    }
  })
})

const handleAdd = () => {
  emit('add', [...selectedEntries.value.values()])
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('admin.newsletterCampaigns.picker.title')"
    :description="t('admin.newsletterCampaigns.picker.description')"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <div
          class="flex gap-2 overflow-x-auto"
          role="tablist"
          :aria-label="t('admin.newsletterCampaigns.picker.tabsAria')"
        >
          <UButton
            v-for="type in NEWSLETTER_CAMPAIGN_ITEM_TYPES"
            :id="`campaign-content-tab-${type}`"
            :key="type"
            :icon="itemTypeIcon(type)"
            :variant="activeType === type ? 'solid' : 'outline'"
            role="tab"
            :aria-selected="activeType === type"
            :aria-controls="tabPanelId"
            :tabindex="activeType === type ? 0 : -1"
            size="sm"
            @click="activeType = type"
          >
            {{ itemTypeLabel(type) }}
          </UButton>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="search"
            icon="i-tabler-search"
            class="min-w-0 flex-1"
            :placeholder="t('admin.newsletterCampaigns.picker.searchPlaceholder')"
            :aria-label="t('admin.newsletterCampaigns.picker.searchPlaceholder')"
          />
          <UButton
            :variant="sinceLastCampaign ? 'solid' : 'outline'"
            color="neutral"
            size="sm"
            icon="i-tabler-history"
            :aria-pressed="sinceLastCampaign"
            @click="sinceLastCampaign = !sinceLastCampaign"
          >
            {{ t('admin.newsletterCampaigns.picker.sinceLastCampaign') }}
          </UButton>
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-tabler-checks"
            :disabled="!selectableEntries.length"
            @click="selectAllVisible"
          >
            {{ t('admin.newsletterCampaigns.picker.selectAllVisible') }}
          </UButton>
        </div>

        <div
          v-if="availableSubtypes.length"
          class="flex flex-wrap items-center gap-2"
          role="group"
          :aria-label="t('admin.newsletterCampaigns.picker.subtypeFilterAria')"
        >
          <span class="text-muted text-xs">
            {{ t('admin.newsletterCampaigns.picker.subtypeFilterLabel') }}
          </span>
          <UButton
            v-for="subtype in availableSubtypes"
            :key="subtype"
            :variant="selectedSubtypes.includes(subtype) ? 'solid' : 'outline'"
            color="neutral"
            size="xs"
            :aria-pressed="selectedSubtypes.includes(subtype)"
            @click="toggleSubtype(subtype)"
          >
            {{ subtypeLabel(subtype) }}
          </UButton>
          <UButton
            v-if="selectedSubtypes.length"
            variant="link"
            color="neutral"
            size="xs"
            @click="selectedSubtypes = []"
          >
            {{ t('admin.newsletterCampaigns.picker.subtypeFilterClear') }}
          </UButton>
        </div>

        <p class="text-muted text-xs">
          {{ t('admin.newsletterCampaigns.picker.searchHint') }}
        </p>

        <div
          :id="tabPanelId"
          role="tabpanel"
          :aria-labelledby="`campaign-content-tab-${activeType}`"
          class="max-h-96 space-y-2 overflow-y-auto"
        >
          <div v-if="isLoading" class="space-y-2" aria-hidden="true">
            <USkeleton v-for="n in 5" :key="n" class="h-16 w-full rounded-lg" />
          </div>

          <div v-else-if="loadError" class="py-8 text-center">
            <p class="text-muted mb-3 text-sm">
              {{ t('admin.newsletterCampaigns.picker.loadError') }}
            </p>
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              icon="i-tabler-refresh"
              @click="load"
            >
              {{ t('admin.common.retry') }}
            </UButton>
          </div>

          <p v-else-if="!entries.length" class="text-muted py-8 text-center text-sm">
            {{ t('admin.newsletterCampaigns.picker.empty') }}
          </p>

          <template v-else>
            <div v-for="group in entryGroups" :key="group.key" class="space-y-2">
              <div
                v-if="group.label"
                class="bg-default sticky top-0 z-10 flex items-center justify-between gap-2 py-1"
              >
                <h3 class="text-toned text-sm font-semibold">{{ group.label }}</h3>
                <UButton
                  variant="outline"
                  color="neutral"
                  size="xs"
                  icon="i-tabler-checks"
                  :disabled="!group.selectableCount || group.allSelected"
                  @click="selectEntries(group.entries)"
                >
                  {{ t('admin.newsletterCampaigns.picker.selectEdition') }}
                </UButton>
              </div>

              <label
                v-for="entry in group.entries"
                :key="`${entry.itemType}:${entry.itemId}`"
                class="hover:bg-elevated/50 flex items-center gap-3 rounded-lg border p-2"
                :class="isTaken(entry) ? 'opacity-60' : 'cursor-pointer'"
              >
                <UCheckbox
                  :model-value="isSelected(entry) || isTaken(entry)"
                  :disabled="isTaken(entry)"
                  @update:model-value="toggleEntry(entry)"
                />

                <img
                  v-if="entry.imageUrl"
                  :src="entry.imageUrl"
                  alt=""
                  class="h-12 w-16 shrink-0 rounded object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="bg-muted text-dimmed flex h-12 w-16 shrink-0 items-center justify-center rounded"
                  aria-hidden="true"
                >
                  <UIcon :name="itemTypeIcon(entry.itemType)" class="size-5 opacity-60" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{{ entry.title }}</p>
                  <div class="text-muted mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                    <span v-if="subtypeLabel(entry.subtype)">{{
                      subtypeLabel(entry.subtype)
                    }}</span>
                    <span>{{ formatEntryDate(entry.date) }}</span>
                    <span v-if="entry.needsExcerptOverride" class="text-warning">
                      {{ t('admin.newsletterCampaigns.picker.noExcerpt') }}
                    </span>
                    <span v-if="isTaken(entry)">
                      {{ t('admin.newsletterCampaigns.picker.taken') }}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </template>
        </div>

        <nav
          v-if="pageCount > 1"
          class="flex justify-center"
          :aria-label="t('admin.newsletterCampaigns.picker.paginationAria')"
        >
          <UPagination v-model:page="page" :total="total" :items-per-page="PAGE_SIZE" size="sm" />
        </nav>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <span class="text-muted text-sm">
          {{ t('admin.newsletterCampaigns.picker.selectedCount', { count: selectedCount }) }}
        </span>
        <div class="flex gap-2">
          <UButton variant="outline" color="neutral" @click="open = false">
            {{ t('admin.common.cancel') }}
          </UButton>
          <UButton icon="i-tabler-plus" :disabled="selectedCount === 0" @click="handleAdd">
            {{ t('admin.newsletterCampaigns.picker.addSelected') }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
