<script setup lang="ts">
import { CAMPAIGNS_API_BASE } from '@/composables/admin/useAdminNewsletterCampaigns'

const props = defineProps<{
  campaignId: string
  /** Bumped by the owner after a save so the iframe reloads with the stored content. */
  reloadToken?: number
  /**
   * The unsaved draft. When given, the preview renders this instead of what is stored, so the
   * email tracks what is being written. Omitted on sent campaigns, which render their frozen
   * snapshot through the GET endpoint.
   */
  draft?: { translations: unknown[]; items: unknown[] } | null
}>()

/** The email body is laid out for 640px; the narrow view matches a common phone viewport. */
const WIDTHS = {
  mobile: 375,
  desktop: 640,
} as const

type PreviewWidth = keyof typeof WIDTHS

const { t } = useI18n()
const { localeConfigs, getLocaleFlag, getLocaleName } = useLocales()

const previewLocale = ref(localeConfigs.value[0]?.code ?? 'es')
const width = ref<PreviewWidth>('desktop')

const localeItems = computed(() =>
  localeConfigs.value.map((config) => ({
    label: getLocaleName(config.code),
    value: config.code,
    icon: getLocaleFlag(config.code),
  }))
)

const previewSrc = computed(
  () =>
    `${CAMPAIGNS_API_BASE}/${props.campaignId}/preview?locale=${encodeURIComponent(previewLocale.value)}`
)

/**
 * Forces a fresh load whenever the locale or the saved content changes: without a changing key the
 * browser can reuse the frame it already painted.
 */
const frameKey = computed(() => `${previewLocale.value}-${props.reloadToken ?? 0}`)

const DRAFT_DEBOUNCE_MS = 500

const draftHtml = ref<string | null>(null)
const draftError = ref(false)
const isRendering = ref(false)

let draftTimer: ReturnType<typeof setTimeout> | null = null
let requestSeq = 0

const renderDraft = async () => {
  if (!props.draft) return

  isRendering.value = true
  // Debounced typing can overtake itself; only the newest response may paint.
  const seq = ++requestSeq

  try {
    const html = await $fetch<string>(`${CAMPAIGNS_API_BASE}/${props.campaignId}/preview`, {
      method: 'POST',
      body: { locale: previewLocale.value, ...props.draft },
    })

    if (seq !== requestSeq) return

    draftHtml.value = html
    draftError.value = false
  } catch {
    if (seq !== requestSeq) return

    draftError.value = true
  } finally {
    if (seq === requestSeq) isRendering.value = false
  }
}

const scheduleDraftRender = () => {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => void renderDraft(), DRAFT_DEBOUNCE_MS)
}

watch(
  () => [props.draft, previewLocale.value],
  () => {
    if (props.draft) scheduleDraftRender()
  },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  if (draftTimer) clearTimeout(draftTimer)
})
</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">{{ t('admin.newsletterCampaigns.preview.title') }}</h2>

      <div class="flex flex-wrap items-center gap-2">
        <USelect
          v-model="previewLocale"
          :items="localeItems"
          value-key="value"
          size="sm"
          class="w-40"
          :aria-label="t('admin.newsletterCampaigns.preview.localeAria')"
        />

        <div
          class="border-default bg-elevated/40 inline-flex rounded-md border p-0.5"
          role="group"
          :aria-label="t('admin.newsletterCampaigns.preview.widthAria')"
        >
          <UButton
            icon="i-tabler-device-mobile"
            :variant="width === 'mobile' ? 'solid' : 'ghost'"
            color="neutral"
            size="xs"
            :aria-pressed="width === 'mobile'"
            :aria-label="t('admin.newsletterCampaigns.preview.mobile')"
            :title="t('admin.newsletterCampaigns.preview.mobile')"
            @click="width = 'mobile'"
          />
          <UButton
            icon="i-tabler-device-desktop"
            :variant="width === 'desktop' ? 'solid' : 'ghost'"
            color="neutral"
            size="xs"
            :aria-pressed="width === 'desktop'"
            :aria-label="t('admin.newsletterCampaigns.preview.desktop')"
            :title="t('admin.newsletterCampaigns.preview.desktop')"
            @click="width = 'desktop'"
          />
        </div>
      </div>
    </div>

    <p class="text-muted text-xs">{{ t('admin.newsletterCampaigns.preview.hint') }}</p>

    <UAlert
      v-if="draftError"
      color="warning"
      variant="soft"
      icon="i-tabler-alert-triangle"
      :description="t('admin.newsletterCampaigns.preview.renderError')"
    />

    <div class="bg-elevated/30 overflow-x-auto rounded-xl border p-4">
      <!--
        `allow-scripts` is deliberately absent from both: the email carries none, so nothing in the
        frame can execute. The draft frame adds `allow-same-origin` because a srcdoc document
        otherwise gets an opaque origin, against which the page's `img-src 'self'` matches nothing
        and every image is blocked. Same-origin without scripts grants no execution.
      -->
      <iframe
        v-if="draft"
        :srcdoc="draftHtml ?? ''"
        sandbox="allow-same-origin"
        class="mx-auto block h-[42rem] max-w-full rounded-lg border bg-white shadow-sm transition-opacity"
        :class="{ 'opacity-60': isRendering }"
        :style="{ width: `${WIDTHS[width]}px` }"
        :title="t('admin.newsletterCampaigns.preview.frameTitle')"
      />
      <iframe
        v-else
        :key="frameKey"
        :src="previewSrc"
        sandbox=""
        loading="lazy"
        class="mx-auto block h-[42rem] max-w-full rounded-lg border bg-white shadow-sm"
        :style="{ width: `${WIDTHS[width]}px` }"
        :title="t('admin.newsletterCampaigns.preview.frameTitle')"
      />
    </div>
  </section>
</template>
