<script setup lang="ts">
import type { PressArticle } from '@/composables/press/usePress'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

defineProps<{
  articles: PressArticle[]
  pending: boolean
  failed: boolean
  siteUrl: string
  imageLoading: 'lazy' | 'eager'
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate } = useLocaleFormatting()

const typeLabelKeys: Record<PressArticleType, string> = {
  press_release: 'press.releases.title',
  statement: 'press.statements.title',
  media_appearance: 'press.inMedia.title',
}

const typeIcons: Record<PressArticleType, string> = {
  press_release: 'i-tabler-file-text',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

const getArticlePath = (article: PressArticle) =>
  localePath(`${getPressArticlePublicListPath(article.type)}/${article.slug}`)

const formatPublishedAt = (iso: string) =>
  formatDate(iso, { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="space-y-8">
    <div class="max-w-3xl space-y-4 leading-relaxed print:max-w-none">
      <p>{{ t('pressKit.pressRoom.paragraph1') }}</p>
      <p>{{ t('pressKit.pressRoom.paragraph2') }}</p>
    </div>

    <div class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('pressKit.pressRoom.latestTitle') }}</h3>

      <PressKitAsyncState
        :pending="pending"
        :failed="failed"
        :error-title="t('press.news.loadError')"
        @retry="emit('retry')"
      >
        <template #skeleton>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <USkeleton v-for="n in 3" :key="n" class="h-72 rounded-xl" />
          </div>
        </template>

        <p v-if="articles.length === 0" class="text-muted">
          {{ t('pressKit.pressRoom.empty') }}
        </p>
        <ul
          v-else
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3"
          :aria-label="t('pressKit.pressRoom.latestTitle')"
        >
          <li v-for="article in articles" :key="article.id" class="print:break-inside-avoid">
            <NuxtLink
              :to="getArticlePath(article)"
              class="motion-link-card group focus-visible:ring-primary/60 bg-default ring-default flex h-full flex-col overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
            >
              <div class="bg-muted relative aspect-video overflow-hidden">
                <AdaptiveImage
                  v-if="article.image"
                  :src="article.image"
                  :alt="article.alt || ''"
                  width="640"
                  height="360"
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 330px"
                  class="motion-link-media size-full object-cover"
                  :loading="imageLoading"
                  decoding="async"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon :name="typeIcons[article.type]" class="size-10" />
                </div>
                <PressMediaOutletLogoOverlay
                  v-if="article.image && article.mediaOutlet?.logo"
                  :logo-url="article.mediaOutlet.logo"
                  :outlet-name="article.mediaOutlet.name"
                  :loading="imageLoading"
                />
              </div>

              <div class="p-4 print:p-3">
                <p class="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <time :datetime="article.publishedAt">{{
                    formatPublishedAt(article.publishedAt)
                  }}</time>
                  <span aria-hidden="true">&middot;</span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon :name="typeIcons[article.type]" class="size-3.5" aria-hidden="true" />
                    {{ t(typeLabelKeys[article.type]) }}
                  </span>
                  <template v-if="article.mediaOutlet">
                    <span aria-hidden="true">&middot;</span>
                    <span>{{ article.mediaOutlet.name }}</span>
                  </template>
                </p>
                <p
                  :lang="article.titleLocale || undefined"
                  class="group-hover:text-primary mt-1.5 line-clamp-3 leading-snug font-semibold transition-colors print:line-clamp-none"
                >
                  {{ article.title }}
                </p>
                <p
                  v-if="article.description"
                  :lang="article.descriptionLocale || undefined"
                  class="text-muted mt-1.5 line-clamp-2 text-sm print:line-clamp-3"
                >
                  {{ article.description }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </PressKitAsyncState>
    </div>

    <PressKitLink
      :to="localePath('/prensa/noticias')"
      icon="i-tabler-news"
      :label="t('pressKit.pressRoom.allNews')"
      :site-url="siteUrl"
    />
  </div>
</template>
