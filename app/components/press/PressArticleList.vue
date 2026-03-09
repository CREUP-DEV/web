<script setup lang="ts">
/**
 * PressArticleList
 * Reusable list component for press articles (press releases, statements, media appearances)
 * Shows articles as cards with cover image, title, description, date, and tags
 */
import type { PressArticleType } from '@/composables/usePress'

const props = defineProps<{
  /** The type of articles to display */
  type: PressArticleType
  /** Page title */
  title: string
  /** Page description */
  description: string
  /** Empty state message */
  emptyMessage: string
  /** Error message */
  errorMessage: string
}>()

const { t } = useI18n()
const { formatDate: formatLocaleDate } = useLocaleFormatting()

const selectedTag = ref<string>('all')

const { data, pending, error } = usePress(props.type, selectedTag)

const articles = computed(() => data.value?.articles ?? [])
const isLoading = computed(() => pending.value || data.value == null)

const typeUrlPrefix: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

const formatDate = (iso: string) => {
  return formatLocaleDate(iso, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const onTagSelect = (tagSlug: string) => {
  selectedTag.value = tagSlug
}
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="title">
    <UContainer>
      <header class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ title }}</h1>
        <p class="text-muted mt-2 max-w-2xl text-lg">{{ description }}</p>
      </header>

      <!-- Tag filter -->
      <HomeTagSelector class="mb-6" @select="onTagSelect" />

      <!-- Loading skeleton -->
      <div
        v-if="isLoading"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        <div v-for="n in 6" :key="n" class="space-y-3">
          <USkeleton class="aspect-video w-full rounded-xl" />
          <USkeleton class="h-5 w-3/4" />
          <USkeleton class="h-4 w-full" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-muted py-12 text-center">
        <UIcon name="i-tabler-alert-circle" class="mx-auto mb-2 size-8 opacity-50" />
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!articles.length" class="text-muted py-12 text-center">
        <UIcon name="i-tabler-news-off" class="mx-auto mb-2 size-8 opacity-50" />
        <p>{{ emptyMessage }}</p>
      </div>

      <!-- Articles grid -->
      <ul v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        <li v-for="article in articles" :key="article.id">
          <NuxtLink
            :to="`${typeUrlPrefix[article.type]}/${article.slug}`"
            class="group focus-visible:ring-primary/60 bg-surface block overflow-hidden rounded-xl ring-1 ring-gray-200/50 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 dark:ring-gray-800/50"
          >
            <!-- Cover image -->
            <div class="bg-muted aspect-video overflow-hidden">
              <NuxtImg
                :src="article.image"
                :alt="article.alt || article.title"
                width="640"
                height="360"
                class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <div class="p-4">
              <!-- Date and media outlet -->
              <div class="text-muted mb-1.5 flex items-center gap-2 text-xs">
                <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
                <template v-if="article.mediaOutlet">
                  <span aria-hidden="true">&middot;</span>
                  <span class="flex items-center gap-1">
                    <NuxtImg
                      :src="article.mediaOutlet.logo"
                      :alt="article.mediaOutlet.name"
                      class="inline-block h-3.5 w-auto"
                    />
                    {{ article.mediaOutlet.name }}
                  </span>
                </template>
              </div>

              <!-- Title -->
              <h2
                class="group-hover:text-primary line-clamp-2 leading-snug font-semibold transition-colors"
              >
                {{ article.title }}
              </h2>

              <!-- Description -->
              <p v-if="article.description" class="text-muted mt-1.5 line-clamp-2 text-sm">
                {{ article.description }}
              </p>

              <!-- Tags -->
              <div v-if="article.tags.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="tag in article.tags"
                  :key="tag.slug"
                  class="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs"
                >
                  {{ tag.name }}
                </span>
              </div>

              <!-- Content indicator -->
              <div
                v-if="article.contentHtml || article.pdfUrl"
                class="text-muted mt-3 flex flex-wrap items-center gap-3 text-xs"
              >
                <div v-if="article.contentHtml" class="flex items-center gap-1">
                  <UIcon name="i-tabler-align-box-left-top" class="size-4" />
                  <span>{{ t('press.readFull') }}</span>
                </div>
                <div v-if="article.pdfUrl" class="flex items-center gap-1">
                  <UIcon name="i-tabler-file-type-pdf" class="size-4" />
                  <span>{{ t('press.downloadPdf') }}</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </UContainer>
  </section>
</template>
