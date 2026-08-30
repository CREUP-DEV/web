<script setup lang="ts">
import type { ActivityDetail } from '@/composables/activity/useActivity'

const props = defineProps<{
  entry: ActivityDetail
  backTo: string
  backLabel: string
}>()

const { t, locale } = useI18n()
const { formatDateRange } = useActivityDates()

// WCAG 3.1.2: mark each rendered field with `lang` when its source language differs from the page.
const fieldLang = (fieldLocale?: string | null) =>
  fieldLocale && fieldLocale !== locale.value ? fieldLocale : undefined
const titleLang = computed(() => fieldLang(props.entry.titleLocale))
const excerptLang = computed(() => fieldLang(props.entry.excerptLocale))
const captionLang = computed(() => fieldLang(props.entry.imageCaptionLocale))
const bodyLang = computed(() => fieldLang(props.entry.contentLocale))

const isMember = computed(() => props.entry.kind === 'member')
const memberLogo = computed(
  () => props.entry.memberOrg?.logoLight ?? props.entry.memberOrg?.logoDark ?? null
)
const placeLabel = computed(() =>
  props.entry.isOnline ? t('activity.online') : props.entry.location
)

const entryRef = toRef(props, 'entry')
const { canonicalUrl, shareActions } = usePressShareActions(entryRef)

usePageSeo(
  () => props.entry.title,
  () => props.entry.excerpt,
  {
    ogImage: () => props.entry.image,
    ogType: () => 'article',
    articlePublishedTime: () => props.entry.publishedAt,
    articleModifiedTime: () => props.entry.updatedAt,
  }
)
</script>

<template>
  <article class="printable-article py-8 sm:py-12">
    <UContainer class="max-w-4xl">
      <AnimateIn tag="nav" :index="0" :threshold="0.12" class="no-print mb-6">
        <NuxtLink
          :to="backTo"
          class="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <UIcon name="i-tabler-arrow-left" class="size-4" />
          {{ backLabel }}
        </NuxtLink>
      </AnimateIn>

      <AnimateIn
        v-if="isMember && entry.memberOrg"
        tag="div"
        :index="1"
        :threshold="0.12"
        class="border-l-primary bg-primary/5 ring-default mb-6 flex items-center gap-4 rounded-xl border-l-4 p-4 ring-1"
      >
        <span
          v-if="memberLogo"
          class="border-creup-dark-gray-200/80 inline-flex h-12 max-w-32 items-center rounded-md border bg-white px-2 py-1 shadow-sm"
        >
          <AdaptiveImage
            :src="memberLogo"
            :alt="entry.memberOrg.denomination"
            width="180"
            height="48"
            fit="inside"
            class="h-10 w-auto max-w-28 object-contain"
          />
        </span>
        <div class="min-w-0">
          <p class="text-primary text-xs font-semibold tracking-wide uppercase">
            {{ t('activity.detail.memberBanner') }}
          </p>
          <p class="truncate font-medium">{{ entry.memberOrg.denomination }}</p>
        </div>
      </AnimateIn>

      <AnimateIn tag="header" :index="2" :threshold="0.12" class="mb-8">
        <div class="text-muted mb-3 flex flex-wrap items-center gap-2 text-sm">
          <time :datetime="entry.startDate">{{
            formatDateRange(entry.startDate, entry.endDate)
          }}</time>
          <template v-if="placeLabel">
            <span aria-hidden="true">&middot;</span>
            <span class="flex items-center gap-1">
              <UIcon
                :name="entry.isOnline ? 'i-tabler-broadcast' : 'i-tabler-map-pin'"
                class="size-4"
              />
              {{ placeLabel }}
            </span>
          </template>
        </div>

        <h1 :lang="titleLang" class="text-3xl leading-tight font-bold sm:text-4xl">
          {{ entry.title }}
        </h1>

        <p class="print-only mt-2 text-sm break-all">
          {{ canonicalUrl }}
        </p>
      </AnimateIn>

      <AnimateIn v-if="entry.image" tag="figure" :index="3" :threshold="0.12" class="mb-8">
        <div class="motion-card-subtle bg-muted relative overflow-hidden rounded-xl">
          <AdaptiveImage
            :src="entry.image"
            :alt="entry.alt || ''"
            width="960"
            height="540"
            class="w-full object-cover"
          />
          <PressMediaOutletLogoOverlay
            v-if="isMember && memberLogo"
            variant="detail"
            :logo-url="memberLogo"
            :outlet-name="entry.memberOrg?.denomination ?? ''"
          />
        </div>
        <figcaption
          v-if="entry.imageCaption"
          :lang="captionLang"
          class="text-muted mt-2 text-center text-sm"
        >
          {{ entry.imageCaption }}
        </figcaption>
      </AnimateIn>

      <AnimateIn :index="4" :threshold="0.08">
        <div v-if="entry.excerpt" class="prose prose-lg dark:prose-invert mb-8 max-w-none">
          <p :lang="excerptLang" class="text-lg leading-relaxed">{{ entry.excerpt }}</p>
        </div>

        <PressRichText :lang="bodyLang" :html="entry.contentHtml" />
      </AnimateIn>

      <AnimateIn :index="5" :threshold="0.08" class="no-print">
        <div class="mt-8 border-t pt-6">
          <p class="text-muted mb-3 text-sm font-medium">{{ t('press.share') }}</p>
          <div class="flex flex-wrap gap-2">
            <UTooltip v-for="action in shareActions" :key="action.key" :text="action.label">
              <UButton
                :to="action.to"
                :icon="action.icon"
                variant="outline"
                size="sm"
                :class="action.class"
                :target="action.to ? '_blank' : undefined"
                :rel="action.to ? 'noopener noreferrer' : undefined"
                :aria-label="action.label"
                @click="action.onClick?.()"
              />
            </UTooltip>
          </div>
        </div>
      </AnimateIn>
    </UContainer>
  </article>
</template>
