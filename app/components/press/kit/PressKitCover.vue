<script setup lang="ts">
import {
  CONTACT_TYPE_QUERY_KEY,
  PRESS_CONTACT_TYPE_QUERY_VALUE,
} from '~~/shared/utils/contactShared'

const props = defineProps<{
  heroImage: string | null
  generatedAt: Date
  isPreparingPrint: boolean
  siteHost: string
}>()

const emit = defineEmits<{
  print: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate } = useLocaleFormatting()

const pressContactPath = computed(() =>
  localePath({
    path: '/contacto',
    query: { [CONTACT_TYPE_QUERY_KEY]: PRESS_CONTACT_TYPE_QUERY_VALUE },
  })
)

const formattedGeneratedAt = computed(() =>
  formatDate(props.generatedAt, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  })
)
</script>

<template>
  <header
    class="space-y-8 text-center print:flex print:min-h-[240mm] print:break-after-page print:flex-col print:justify-between print:space-y-0"
  >
    <div class="flex flex-col items-center print:pt-[18mm]">
      <img
        src="/nav/creup-site-header-logo-light.svg"
        :alt="t('accessibility.siteLogo')"
        width="144"
        height="32"
        class="h-10 w-auto dark:hidden print:block! print:h-14"
      />
      <img
        src="/nav/creup-site-header-logo-dark.svg"
        :alt="t('accessibility.siteLogo')"
        width="144"
        height="32"
        class="hidden h-10 w-auto dark:block print:hidden!"
      />

      <p class="text-muted mt-6 text-sm font-medium tracking-wide uppercase print:mt-10">
        {{ t('pressKit.cover.organization') }}
      </p>
      <h1 class="mt-3 text-4xl font-bold sm:text-5xl print:text-6xl">
        {{ t('nav.press.pressKit') }}
      </h1>
      <p class="text-primary mt-4 font-serif text-xl sm:text-2xl print:text-3xl">
        {{ t('pressKit.tagline') }}
      </p>
    </div>

    <div
      v-if="heroImage"
      class="bg-muted aspect-1925/550 overflow-hidden rounded-3xl border print:rounded-xl"
    >
      <AdaptiveImage
        :src="heroImage"
        :alt="t('pressKit.cover.heroAlt')"
        width="1925"
        height="550"
        class="size-full object-cover"
        loading="eager"
        fetchpriority="high"
        decoding="async"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px"
      />
    </div>

    <div class="no-print space-y-5">
      <p class="text-muted mx-auto max-w-2xl leading-relaxed">
        {{ t('pressKit.cover.liveNote') }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <!-- Opens the print dialog: the file comes from its "Save as PDF" destination. -->
        <UButton
          type="button"
          icon="i-tabler-file-type-pdf"
          class="archived:hidden"
          :loading="isPreparingPrint"
          :label="t('pressKit.cover.printAction')"
          aria-describedby="press-kit-print-hint"
          @click="emit('print')"
        />
        <UButton
          :to="pressContactPath"
          color="neutral"
          variant="soft"
          icon="i-tabler-mail"
          :label="t('contactPage.contactType.press')"
        />
      </div>
      <p id="press-kit-print-hint" class="text-muted archived:hidden mx-auto max-w-2xl text-sm">
        {{ t('pressKit.cover.printHint') }}
      </p>
    </div>

    <p class="print-only text-muted text-sm">
      {{ t('pressKit.cover.generatedOn', { date: formattedGeneratedAt }) }} · {{ siteHost }}
    </p>
  </header>
</template>
