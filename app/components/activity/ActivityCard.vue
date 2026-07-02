<script setup lang="ts">
import type { ActivityListItem } from '@/composables/activity/useActivity'

const props = defineProps<{
  item: ActivityListItem
  to: string
}>()

const { t, locale } = useI18n()
const { formatDateRange } = useActivityDates()

// WCAG 3.1.2: mark a field with `lang` when its source language differs from the page.
const fieldLang = (fieldLocale?: string | null) =>
  fieldLocale && fieldLocale !== locale.value ? fieldLocale : undefined
const titleLang = computed(() => fieldLang(props.item.titleLocale))
const excerptLang = computed(() => fieldLang(props.item.excerptLocale))

const memberLogo = computed(
  () => props.item.memberOrg?.logoLight ?? props.item.memberOrg?.logoDark ?? null
)
const placeLabel = computed(() =>
  props.item.isOnline ? t('activity.online') : props.item.location
)
</script>

<template>
  <NuxtLink
    :to="to"
    class="motion-link-card group focus-visible:ring-primary/60 bg-surface ring-default block overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
  >
    <div class="bg-muted relative aspect-video overflow-hidden">
      <AdaptiveImage
        v-if="item.image"
        :src="item.image"
        :alt="item.alt || ''"
        width="640"
        height="360"
        class="motion-link-media size-full object-cover"
        loading="lazy"
      />
      <div v-else class="text-muted flex size-full items-center justify-center" aria-hidden="true">
        <UIcon name="i-tabler-calendar-event" class="size-12" />
      </div>
      <PressMediaOutletLogoOverlay
        v-if="item.image && item.kind === 'member' && memberLogo"
        :logo-url="memberLogo"
        :outlet-name="item.memberOrg?.denomination ?? ''"
      />
    </div>

    <div class="p-4">
      <div class="text-muted mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <time :datetime="item.startDate">{{ formatDateRange(item.startDate, item.endDate) }}</time>
        <template v-if="placeLabel">
          <span aria-hidden="true">&middot;</span>
          <span class="flex items-center gap-1">
            <UIcon
              :name="item.isOnline ? 'i-tabler-broadcast' : 'i-tabler-map-pin'"
              class="size-3.5"
            />
            {{ placeLabel }}
          </span>
        </template>
        <template v-if="item.kind === 'member'">
          <span aria-hidden="true">&middot;</span>
          <span class="flex items-center gap-1">
            <UIcon name="i-tabler-users-group" class="size-3.5" />
            {{ t('activity.memberEvent') }}
          </span>
        </template>
      </div>

      <UTooltip :text="item.title">
        <h2
          :lang="titleLang"
          class="group-hover:text-primary line-clamp-2 leading-snug font-semibold transition-colors"
        >
          {{ item.title }}
        </h2>
      </UTooltip>

      <p v-if="item.excerpt" :lang="excerptLang" class="text-muted mt-1.5 line-clamp-2 text-sm">
        {{ item.excerpt }}
      </p>
    </div>
  </NuxtLink>
</template>
