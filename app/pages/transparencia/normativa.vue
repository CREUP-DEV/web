<script setup lang="ts">
interface NormativaDocumentFile {
  name: string | null
  url: string | null
}

interface NormativaDocument {
  order: number
  name: string
  date: string
  assembly: string | null
  file: NormativaDocumentFile | null
}

interface NormativaCategory {
  category: string
  documents: NormativaDocument[]
}

interface NormativaResponse {
  categories: NormativaCategory[]
  generatedAt?: string | null
}

const { t, te } = useI18n()
const { formatLongDate } = useDatePresets()

function toCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function translateCategory(name: string): string {
  const key = `regulations.categories.${toCategorySlug(name)}`
  return te(key) ? t(key) : name
}

usePageSeo('regulations.title', 'regulations.description')

const { data, error } = await useFetch<NormativaResponse>('/api/normativa')

const categories = computed(() => data.value?.categories ?? [])
const getEntranceDelay = (index: number) => useEntranceDelay(index, 90)

function formatDate(dateStr: string): string {
  try {
    return formatLongDate(dateStr)
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
          {{ t('regulations.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('regulations.description') }}
        </p>
      </header>

      <UCard v-if="error" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
          <p class="text-muted">
            {{ t('regulations.loadError') }}
          </p>
        </div>
      </UCard>

      <UCard v-else-if="categories.length === 0" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-file-off" class="text-muted size-10" />
          <p class="text-muted">
            {{ t('regulations.empty') }}
          </p>
        </div>
      </UCard>

      <div v-else class="space-y-8">
        <section v-for="(cat, categoryIndex) in categories" :key="cat.category" class="space-y-3">
          <h2 class="text-xl font-semibold">
            {{ translateCategory(cat.category) }}
          </h2>

          <TransitionGroup
            appear
            tag="ul"
            name="stagger-list"
            class="space-y-3"
            :aria-label="cat.category"
          >
            <li v-for="(doc, documentIndex) in cat.documents" :key="doc.order">
              <UCard
                class="motion-card"
                :style="getEntranceDelay(categoryIndex * 2 + documentIndex)"
              >
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
        </section>
      </div>
    </article>
  </UContainer>
</template>
