<script setup lang="ts">
import type { RecentActivityItem } from '@/composables/home/useHome'

const props = withDefaults(
  defineProps<{
    items: RecentActivityItem[]
    pending?: boolean
    error?: boolean
  }>(),
  {
    pending: false,
    error: false,
  }
)
const emit = defineEmits<{
  retry: []
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { formatDateRange } = useActivityDates()

// WCAG 3.1.2: mark a field with `lang` when its source language differs from the page.
const fieldLang = (fieldLocale?: string | null) =>
  fieldLocale && fieldLocale !== locale.value ? fieldLocale : undefined

const memberLogo = (item: RecentActivityItem) =>
  item.memberOrg?.logoLight ?? item.memberOrg?.logoDark ?? null

const placeLabel = (item: RecentActivityItem) =>
  item.isOnline ? t('activity.online') : item.location
</script>

<template>
  <section
    v-if="props.pending || props.error || props.items.length"
    aria-labelledby="recent-activity-heading"
    class="py-4 sm:py-6"
  >
    <UContainer>
      <header class="mb-3 flex items-center justify-between sm:mb-5">
        <h2 id="recent-activity-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('activity.homeTitle') }}
        </h2>
        <UButton
          :to="localePath('/transparencia/actividad')"
          color="secondary"
          variant="outline"
          size="sm"
          class="shrink-0 rounded-full"
          trailing-icon="i-tabler-arrow-right"
        >
          {{ t('activity.viewAll') }}
        </UButton>
      </header>

      <div aria-live="polite" :aria-busy="props.pending || undefined">
        <div
          v-if="props.pending"
          aria-hidden="true"
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div v-for="n in 4" :key="n" class="bg-surface/50 overflow-hidden rounded-xl">
            <USkeleton class="aspect-video" />
            <div class="space-y-2 p-3">
              <USkeleton class="h-3 w-1/2" />
              <USkeleton class="h-4 w-3/4" />
            </div>
          </div>
        </div>

        <div v-else-if="props.error" class="space-y-3">
          <UAlert
            color="error"
            variant="soft"
            icon="i-tabler-alert-triangle"
            :title="t('activity.loadError')"
          />
          <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="emit('retry')">
            {{ t('home.retry') }}
          </UButton>
        </div>

        <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
          <li v-for="item in props.items" :key="item.id">
            <NuxtLink
              :to="localePath(item.path)"
              class="motion-link-card group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface ring-default block h-full overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
            >
              <div class="bg-muted relative aspect-video overflow-hidden">
                <AdaptiveImage
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.alt || ''"
                  width="480"
                  height="270"
                  class="motion-link-media size-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon name="i-tabler-calendar-event" class="size-10" />
                </div>
                <PressMediaOutletLogoOverlay
                  v-if="item.image && item.kind === 'member' && memberLogo(item)"
                  :logo-url="memberLogo(item)!"
                  :outlet-name="item.memberOrg?.denomination ?? ''"
                />
              </div>

              <div class="p-3">
                <div
                  class="text-muted mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs"
                >
                  <time :datetime="item.startDate">
                    {{ formatDateRange(item.startDate, item.endDate) }}
                  </time>
                  <template v-if="placeLabel(item)">
                    <span aria-hidden="true">&middot;</span>
                    <span class="truncate">{{ placeLabel(item) }}</span>
                  </template>
                </div>
                <UTooltip :text="item.title">
                  <p
                    :lang="fieldLang(item.titleLocale)"
                    class="group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium transition-colors"
                  >
                    {{ item.title }}
                  </p>
                </UTooltip>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </UContainer>
  </section>
</template>
