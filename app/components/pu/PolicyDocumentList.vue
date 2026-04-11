<script setup lang="ts">
interface PolicyDocumentFile {
  name: string | null
  url: string | null
}

interface PolicyDocument {
  order: number
  name: string
  date: string
  assembly: string | null
  file: PolicyDocumentFile | null
}

interface PolicyDocumentsResponse {
  documents: PolicyDocument[]
  generatedAt?: string | null
}

const props = defineProps<{
  apiEndpoint: string
  titleKey: string
  descriptionKey: string
  errorKey: string
  emptyKey: string
}>()

const { t } = useI18n()
const { formatDate: formatLocaleDate } = useLocaleFormatting()

const { data, pending, error } = useFetch<PolicyDocumentsResponse>(props.apiEndpoint)

const documents = computed(() => data.value?.documents ?? [])
const getEntranceDelay = (index: number) => useEntranceDelay(index, 70)

function formatDate(dateStr: string): string {
  try {
    return formatLocaleDate(dateStr, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-8">
      <header class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t(titleKey) }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t(descriptionKey) }}
        </p>
      </header>

      <div aria-live="polite" :aria-busy="pending || undefined">
        <div v-if="pending" aria-hidden="true" class="space-y-3">
          <USkeleton v-for="n in 5" :key="n" class="h-20 rounded-xl" />
        </div>

        <UCard v-else-if="error" class="text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
            <p class="text-muted">
              {{ t(errorKey) }}
            </p>
          </div>
        </UCard>

        <UCard v-else-if="!documents.length" class="text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <UIcon name="i-tabler-file-off" class="text-muted size-10" />
            <p class="text-muted">
              {{ t(emptyKey) }}
            </p>
          </div>
        </UCard>

        <TransitionGroup
          v-else
          appear
          tag="ul"
          name="stagger-list"
          class="space-y-3"
          :aria-label="t(titleKey)"
        >
          <li v-for="(doc, index) in documents" :key="doc.order">
            <UCard class="motion-card" :style="getEntranceDelay(index)">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0 flex-1 space-y-1">
                  <p class="text-base leading-snug font-medium">
                    {{ doc.name }}
                  </p>
                  <div class="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-tabler-calendar" class="size-4 shrink-0" aria-hidden="true" />
                      <time :datetime="doc.date">{{ formatDate(doc.date) }}</time>
                    </span>
                    <UBadge v-if="doc.assembly" color="neutral" variant="subtle" size="sm">
                      {{ doc.assembly }}
                    </UBadge>
                  </div>
                </div>

                <UButton
                  v-if="doc.file?.url"
                  :href="doc.file.url"
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="soft"
                  icon="i-tabler-download"
                  size="sm"
                  :label="t('policy.download')"
                  :aria-label="`${t('policy.download')}: ${doc.name}`"
                />
              </div>
            </UCard>
          </li>
        </TransitionGroup>
      </div>
    </article>
  </UContainer>
</template>
