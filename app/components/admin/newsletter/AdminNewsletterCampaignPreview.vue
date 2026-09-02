<script setup lang="ts">
import { CAMPAIGNS_API_BASE } from '@/composables/admin/useAdminNewsletterCampaigns'

const props = defineProps<{
  campaignId: string
  /** Bumped by the owner after a save so the iframe reloads with the stored content. */
  reloadToken?: number
  /**
   * There are edits the preview cannot show. It renders whatever is stored, so unsaved text and
   * content are simply not in it — saying so beats letting the frame look like a live view of the
   * form.
   */
  stale?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{ save: [] }>()

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
      v-if="stale"
      color="warning"
      variant="soft"
      icon="i-tabler-refresh-alert"
      :description="t('admin.newsletterCampaigns.preview.staleDescription')"
    >
      <template #actions>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          icon="i-tabler-device-floppy"
          :loading="saving"
          @click="emit('save')"
        >
          {{ t('admin.newsletterCampaigns.preview.staleAction') }}
        </UButton>
      </template>
    </UAlert>

    <div class="bg-elevated/30 overflow-x-auto rounded-xl border p-4">
      <!-- Empty `sandbox`: the email carries no scripts and no forms, so nothing in the rendered
           HTML needs to run even if the server-side sanitizer ever let something through. -->
      <iframe
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
