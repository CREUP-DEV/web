<script setup lang="ts">
/**
 * PolicyDocumentList — shared component for policy document pages
 * Displays a list of documents fetched from the external API with
 * their name, assembly, date, and a download button.
 */

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
  /** The API endpoint to fetch documents from (e.g., '/api/posicionamientos') */
  apiEndpoint: string
  /** i18n key for the page title */
  titleKey: string
  /** i18n key for the page description */
  descriptionKey: string
  /** i18n key for the error message */
  errorKey: string
  /** i18n key for the empty state */
  emptyKey: string
}>()

const { t, locale } = useI18n()

const { data, error } = await useFetch<PolicyDocumentsResponse>(props.apiEndpoint)

const documents = computed(() => data.value?.documents ?? [])

/**
 * Format a date string to a locale-aware representation.
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-GB', {
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

      <!-- Error state -->
      <UCard v-if="error" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
          <p class="text-muted">
            {{ t(errorKey) }}
          </p>
        </div>
      </UCard>

      <!-- Empty state -->
      <UCard v-else-if="documents.length === 0" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-file-off" class="text-muted size-10" />
          <p class="text-muted">
            {{ t(emptyKey) }}
          </p>
        </div>
      </UCard>

      <!-- Document list -->
      <ul v-else class="space-y-3" :aria-label="t(titleKey)">
        <li v-for="doc in documents" :key="doc.order">
          <UCard>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0 flex-1 space-y-1">
                <p class="text-base leading-snug font-medium">
                  {{ doc.name }}
                </p>
                <div class="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-tabler-calendar" class="size-4 shrink-0" />
                    <time :datetime="doc.date">{{ formatDate(doc.date) }}</time>
                  </span>
                  <UBadge v-if="doc.assembly" color="neutral" variant="subtle" size="sm">
                    {{ doc.assembly }}
                  </UBadge>
                </div>
              </div>

              <UButton
                v-if="doc.file?.url"
                :to="doc.file.url"
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
      </ul>
    </article>
  </UContainer>
</template>
