<script setup lang="ts">
import type { PressArticle } from '@/composables/press/usePress'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import {
  CONTACT_TYPE_QUERY_KEY,
  PRESS_CONTACT_TYPE_QUERY_VALUE,
} from '~~/shared/utils/contactShared'

defineProps<{
  articles: PressArticle[]
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

const pressContactPath = computed(() =>
  localePath({
    path: '/contacto',
    query: { [CONTACT_TYPE_QUERY_KEY]: PRESS_CONTACT_TYPE_QUERY_VALUE },
  })
)

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

    <ul class="flex flex-wrap gap-3 print:block print:space-y-1">
      <li>
        <PressKitLink
          :to="localePath('/prensa/noticias')"
          icon="i-tabler-news"
          :label="t('pressKit.pressRoom.allNews')"
          :site-url="siteUrl"
        />
      </li>
      <li>
        <PressKitLink
          :to="pressContactPath"
          icon="i-tabler-mail"
          color="neutral"
          :label="t('contactPage.contactType.press')"
          :site-url="siteUrl"
        />
      </li>
    </ul>

    <div class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('pressKit.pressRoom.latestTitle') }}</h3>

      <PressKitAsyncState
        :pending="pending"
        :failed="failed"
        :error-title="t('press.news.loadError')"
        @retry="emit('retry')"
      >
        <template #skeleton>
          <div class="space-y-3">
            <USkeleton v-for="n in 4" :key="n" class="h-20 rounded-xl" />
          </div>
        </template>

        <p v-if="articles.length === 0" class="text-muted">
          {{ t('pressKit.pressRoom.empty') }}
        </p>
        <ul
          v-else
          class="divide-default ring-default bg-default divide-y rounded-xl ring-1"
          :aria-label="t('pressKit.pressRoom.latestTitle')"
        >
          <li v-for="article in articles" :key="article.id" class="p-4 print:break-inside-avoid">
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
            <NuxtLink
              :to="getArticlePath(article)"
              :lang="article.titleLocale || undefined"
              class="hover:text-primary mt-1 block leading-snug font-semibold underline-offset-2 transition-colors hover:underline"
            >
              {{ article.title }}
            </NuxtLink>
            <p
              v-if="article.description"
              :lang="article.descriptionLocale || undefined"
              class="text-muted mt-1 line-clamp-2 text-sm print:line-clamp-none"
            >
              {{ article.description }}
            </p>
          </li>
        </ul>
      </PressKitAsyncState>
    </div>
  </div>
</template>
