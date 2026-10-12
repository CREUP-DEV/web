<script setup lang="ts">
import type { PolicyDocument } from '@/types/policy'

defineProps<{
  documents: PolicyDocument[]
  pending: boolean
  failed: boolean
  siteUrl: string
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate } = useLocaleFormatting()

const policyLinks = computed(() => [
  {
    key: 'positions',
    to: localePath('/politica/posicionamientos'),
    label: t('policy.positions.title'),
    icon: 'i-tabler-file-text',
  },
  {
    key: 'resolutions',
    to: localePath('/politica/resoluciones'),
    label: t('policy.resolutions.title'),
    icon: 'i-tabler-gavel',
  },
  {
    key: 'reports',
    to: localePath('/politica/informes-ejecutivos'),
    label: t('policy.reports.title'),
    icon: 'i-tabler-report',
  },
])

const formatDocumentDate = (date: string) => {
  try {
    return formatDate(date, { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return date
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="space-y-4 leading-relaxed">
      <p>{{ t('pressKit.positions.paragraph1') }}</p>
      <p>{{ t('pressKit.positions.paragraph2') }}</p>
    </div>

    <ul
      class="flex flex-wrap gap-3 print:block print:space-y-1"
      :aria-label="t('nav.policy.label')"
    >
      <li v-for="link in policyLinks" :key="link.key">
        <PressKitLink
          :to="link.to"
          :icon="link.icon"
          color="neutral"
          :label="link.label"
          :site-url="siteUrl"
        />
      </li>
    </ul>

    <div class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('pressKit.positions.listTitle') }}</h3>

      <PressKitAsyncState
        :pending="pending"
        :failed="failed"
        :error-title="t('policy.positions.loadError')"
        @retry="emit('retry')"
      >
        <template #skeleton>
          <div class="space-y-3">
            <USkeleton v-for="n in 5" :key="n" class="h-16 rounded-xl" />
          </div>
        </template>

        <p v-if="documents.length === 0" class="text-muted">{{ t('policy.positions.empty') }}</p>
        <ul
          v-else
          class="divide-default ring-default bg-default divide-y rounded-xl ring-1"
          :aria-label="t('pressKit.positions.listTitle')"
        >
          <li
            v-for="document in documents"
            :key="`${document.order}-${document.name}`"
            class="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between print:break-inside-avoid print:flex-row print:items-center print:py-3"
          >
            <div class="min-w-0 flex-1 space-y-1">
              <p class="leading-snug font-medium">{{ document.name }}</p>
              <p class="text-muted flex flex-wrap items-center gap-x-2 text-sm">
                <time :datetime="document.date">{{ formatDocumentDate(document.date) }}</time>
                <template v-if="document.assembly">
                  <span aria-hidden="true">&middot;</span>
                  <span>{{ document.assembly }}</span>
                </template>
              </p>
            </div>

            <UButton
              v-if="document.file?.url"
              :href="document.file.url"
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="soft"
              size="sm"
              icon="i-tabler-file-type-pdf"
              class="self-start sm:self-auto"
              :label="t('policy.download')"
              :aria-label="`${t('policy.download')}: ${document.name}`"
            />
          </li>
        </ul>
      </PressKitAsyncState>
    </div>
  </div>
</template>
