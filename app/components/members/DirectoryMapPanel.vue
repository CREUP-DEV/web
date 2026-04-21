<script setup lang="ts">
import { useAutoAnimate } from '@formkit/auto-animate/vue'

const props = defineProps<{
  selectedCommunity: string | null
  memberCounts: Record<string, number>
  communityFilters: Array<{
    slug: string
    label: string
    count: number
  }>
}>()

const emit = defineEmits<{
  (e: 'select', community: string | null): void
}>()

const { t } = useI18n()
const [mapActionsRef] = useAutoAnimate()
const [mapButtonsRef] = useAutoAnimate()

const selectItems = computed(() =>
  props.communityFilters.map((community) => ({
    label: `${community.label} (${community.count})`,
    value: community.slug,
  }))
)

const selectedCommunityLabel = computed(() => {
  const selected = props.communityFilters.find(
    (community) => community.slug === props.selectedCommunity
  )
  return selected?.label ?? ''
})

const selectionSummary = computed(() =>
  props.selectedCommunity
    ? t('members.mapSelectionSummary', { community: selectedCommunityLabel.value })
    : t('members.mapSelectionAllSummary')
)

const handleSelect = (community: string | null) => {
  emit('select', community)
}
</script>

<template>
  <section aria-labelledby="map-heading">
    <h3 id="map-heading" class="sr-only">{{ t('members.selectCommunity') }}</h3>
    <div class="members-map-theme bg-surface/50 ring-default rounded-xl p-4 ring-1 sm:p-6">
      <div class="border-default/60 mb-5 space-y-3 border-b pb-4">
        <div class="space-y-1">
          <p class="text-muted text-sm font-medium" aria-live="polite" aria-atomic="true">
            {{ selectionSummary }}
          </p>
          <p class="text-muted text-xs">
            {{ t('members.representedCommunities', { count: communityFilters.length }) }}
          </p>
        </div>

        <div
          class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
          :aria-label="t('members.mapLegendLabel')"
        >
          <span class="inline-flex items-center gap-2">
            <span
              class="members-map-legend-dot members-map-legend-dot--selected"
              aria-hidden="true"
            />
            {{ t('members.mapLegendSelected') }}
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="members-map-legend-dot members-map-legend-dot--active"
              aria-hidden="true"
            />
            {{ t('members.mapLegendActive') }}
          </span>
          <span class="inline-flex items-center gap-2">
            <span
              class="members-map-legend-dot members-map-legend-dot--inactive"
              aria-hidden="true"
            />
            {{ t('members.mapLegendInactive') }}
          </span>
        </div>
      </div>

      <LazyMembersSpainMap
        :selected-community="selectedCommunity"
        :member-counts="memberCounts"
        @select="handleSelect"
      />

      <div ref="mapActionsRef" class="mt-6 space-y-4">
        <div v-if="communityFilters.length" class="space-y-3">
          <p class="text-muted text-sm font-medium">{{ t('members.mapFilterTitle') }}</p>
          <p class="text-muted text-xs leading-relaxed">
            {{ t('members.mapAccessibleHelp') }}
          </p>
          <USelectMenu
            :model-value="selectedCommunity ?? undefined"
            :items="selectItems"
            value-key="value"
            class="w-full sm:hidden"
            :placeholder="t('members.mapFilterTitle')"
            :ui="{ placeholder: 'truncate text-muted' }"
            @update:model-value="handleSelect($event ?? null)"
          />

          <div class="hidden sm:flex sm:flex-wrap sm:gap-2">
            <UButton
              v-for="community in communityFilters"
              :key="community.slug"
              type="button"
              size="md"
              class="justify-center"
              :color="selectedCommunity === community.slug ? 'primary' : 'neutral'"
              :variant="selectedCommunity === community.slug ? 'solid' : 'outline'"
              :aria-pressed="selectedCommunity === community.slug"
              :class="selectedCommunity === community.slug ? 'shadow-sm' : ''"
              @click="handleSelect(selectedCommunity === community.slug ? null : community.slug)"
            >
              {{ community.label }} ({{ community.count }})
            </UButton>
          </div>
        </div>

        <div ref="mapButtonsRef" class="flex items-center justify-center gap-3">
          <div v-if="selectedCommunity" class="flex items-center justify-center">
            <UButton variant="soft" icon="i-tabler-map" size="sm" @click="handleSelect(null)">
              {{ t('members.showAll') }}
            </UButton>
          </div>

          <div class="flex items-center justify-center">
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-tabler-list-search"
              size="sm"
              href="#members-list"
            >
              {{ t('members.skipMap') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
