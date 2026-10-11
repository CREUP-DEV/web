<script setup lang="ts">
const props = defineProps<{
  heroImage: string | null
  generatedAt: Date
  siteHost: string
}>()

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()

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
  <!--
    On screen, the page's title and the photo, with the contents right after. On paper, the cover
    page: the same heading and photo, with the logo, the organisation and the date around them.
  -->
  <header
    class="print:flex print:min-h-[240mm] print:break-after-page print:flex-col print:justify-between print:text-center"
  >
    <div class="print:flex print:flex-col print:items-center print:pt-[18mm]">
      <img
        src="/nav/creup-site-header-logo-light.svg"
        :alt="t('accessibility.siteLogo')"
        width="144"
        height="32"
        class="hidden h-14 w-auto print:block"
      />
      <p
        class="text-muted hidden text-sm font-medium tracking-wide uppercase print:mt-10 print:block"
      >
        {{ t('pressKit.cover.organization') }}
      </p>
      <h1 class="text-3xl font-bold sm:text-4xl print:mt-3 print:text-6xl">
        {{ t('nav.press.pressKit') }}
      </h1>
      <p class="text-primary mt-2 font-serif text-xl print:mt-4 print:text-3xl">
        {{ t('pressKit.tagline') }}
      </p>
    </div>

    <div
      v-if="heroImage"
      class="bg-muted mt-6 aspect-1925/550 overflow-hidden rounded-3xl border print:mt-0 print:rounded-xl"
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

    <p class="print-only text-muted text-sm">
      {{ t('pressKit.cover.generatedOn', { date: formattedGeneratedAt }) }} · {{ siteHost }}
    </p>
  </header>
</template>
