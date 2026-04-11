<script setup lang="ts">
import type { PressArticle } from '@/composables/usePress'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import { serializeJsonForHtmlScript } from '~~/shared/utils/json'

const props = defineProps<{
  article: PressArticle
  backTo: string
  backLabel: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate: formatLocaleDate } = useLocaleFormatting()
const articleRef = toRef(props, 'article')
const siteConfig = useSiteConfig()
const { canonicalUrl, shareActions } = usePressShareActions(articleRef)

const formatDate = (iso: string) => {
  return formatLocaleDate(iso, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const siteUrl = computed(() => String(siteConfig.url ?? '').replace(/\/$/, ''))

const backToAbsolute = computed(() => {
  const base = siteUrl.value
  const path = typeof props.backTo === 'string' ? props.backTo : ''
  return path ? `${base}${path}` : base
})

useHead(
  computed(() => ({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: serializeJsonForHtmlScript({
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: props.article.title,
          description: props.article.description || undefined,
          datePublished: props.article.publishedAt,
          dateModified: props.article.updatedAt ?? props.article.publishedAt,
          image: props.article.image || undefined,
          url: canonicalUrl.value,
          author: {
            '@type': 'Organization',
            name: siteConfig.name,
            url: siteUrl.value || undefined,
          },
          publisher: {
            '@type': 'Organization',
            name: siteConfig.name,
            url: siteUrl.value || undefined,
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl.value,
          },
        }),
      },
      {
        type: 'application/ld+json',
        innerHTML: serializeJsonForHtmlScript({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: siteConfig.name,
              item: siteUrl.value || undefined,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: props.backLabel,
              item: backToAbsolute.value,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: props.article.title,
              item: canonicalUrl.value,
            },
          ],
        }),
      },
    ],
  }))
)

const externalLinkLabel = computed(() => {
  if (props.article.type === 'media_appearance') {
    return t('press.readOriginal')
  }
  return t('press.readFull')
})

usePageSeo(
  () => props.article.title,
  () => props.article.description,
  {
    ogImage: () => props.article.image,
    ogType: () => 'article',
  }
)
</script>

<template>
  <article class="press-print py-8 sm:py-12">
    <UContainer class="max-w-4xl">
      <AnimateIn tag="nav" :index="0" :threshold="0.12" class="no-print mb-6">
        <NuxtLink
          :to="backTo"
          class="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <UIcon name="i-tabler-arrow-left" class="size-4" />
          {{ backLabel }}
        </NuxtLink>
      </AnimateIn>

      <AnimateIn tag="header" :index="1" :threshold="0.12" class="mb-8">
        <div class="text-muted mb-3 flex flex-wrap items-center gap-2 text-sm">
          <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
          <template v-if="article.mediaOutlet">
            <span aria-hidden="true">&middot;</span>
            <a
              :href="article.mediaOutlet.website"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary inline-flex items-center gap-1.5 transition-colors"
            >
              <span class="inline-flex h-5 max-w-24 items-center">
                <NuxtImg
                  :src="article.mediaOutlet.logo"
                  :alt="article.mediaOutlet.name"
                  height="20"
                  width="96"
                  class="h-5 w-auto max-w-24 object-contain"
                />
              </span>
              {{ article.mediaOutlet.name }}
              <UIcon name="i-tabler-external-link" class="size-3.5" />
            </a>
          </template>
        </div>

        <h1 class="text-3xl leading-tight font-bold sm:text-4xl">
          {{ article.title }}
        </h1>

        <p class="print-only mt-2 text-sm break-all">
          {{ canonicalUrl }}
        </p>

        <div v-if="article.tags.length" class="mt-4 flex flex-wrap gap-2">
          <NuxtLink
            v-for="tag in article.tags"
            :key="tag.slug"
            :to="localePath(`${getPressArticlePublicListPath(props.article.type)}?tag=${tag.slug}`)"
            class="bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-full px-3 py-1 text-sm transition-colors"
          >
            {{ tag.name }}
          </NuxtLink>
        </div>
      </AnimateIn>

      <AnimateIn v-if="article.image" tag="figure" :index="2" :threshold="0.12" class="mb-8">
        <div class="motion-card-subtle bg-muted overflow-hidden rounded-xl">
          <NuxtImg
            :src="article.image"
            :alt="article.alt || ''"
            width="960"
            height="540"
            class="w-full object-cover"
          />
        </div>
      </AnimateIn>

      <AnimateIn :index="3" :threshold="0.08">
        <div v-if="article.description" class="prose prose-lg dark:prose-invert mb-8 max-w-none">
          <p class="text-lg leading-relaxed">{{ article.description }}</p>
        </div>

        <PressRichText :html="article.contentHtml" />
      </AnimateIn>

      <AnimateIn :index="4" :threshold="0.08" class="no-print">
        <div v-if="article.pdfUrl || article.externalUrl" class="mt-8 flex flex-wrap gap-3">
          <UButton
            v-if="article.pdfUrl"
            :href="article.pdfUrl"
            external
            target="_blank"
            icon="i-tabler-download"
            size="lg"
          >
            {{ t('press.downloadPdf') }}
          </UButton>

          <UButton
            v-if="article.externalUrl"
            :to="article.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-tabler-external-link"
            size="lg"
          >
            {{ externalLinkLabel }}
          </UButton>
        </div>

        <div class="mt-8 border-t pt-6">
          <p class="text-muted mb-3 text-sm font-medium">{{ t('press.share') }}</p>
          <div class="flex flex-wrap gap-2">
            <UTooltip v-for="action in shareActions" :key="action.key" :text="action.label">
              <UButton
                :to="action.to"
                :icon="action.icon"
                variant="outline"
                size="sm"
                :class="action.class"
                :target="action.to ? '_blank' : undefined"
                :rel="action.to ? 'noopener noreferrer' : undefined"
                :aria-label="action.label"
                @click="action.onClick?.()"
              />
            </UTooltip>
          </div>
        </div>
      </AnimateIn>
    </UContainer>
  </article>
</template>

<style scoped>
@media print {
  @page {
    margin: 16mm;
  }

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .press-print {
    padding: 0 !important;
    color: #000 !important;
  }

  .press-print :deep(h1) {
    font-size: 22pt !important;
    line-height: 1.2 !important;
  }

  .press-print :deep(img) {
    page-break-inside: avoid;
    break-inside: avoid;
    max-height: 160mm;
    object-fit: contain;
  }

  .press-print :deep(figure),
  .press-print :deep(header) {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .press-print :deep(.article-body) {
    font-size: 11pt;
    line-height: 1.6;
  }

  .press-print :deep(.article-body h2),
  .press-print :deep(.article-body h3),
  .press-print :deep(.article-body h4) {
    page-break-after: avoid;
    break-after: avoid;
  }

  .press-print :deep(.article-body p),
  .press-print :deep(.article-body ul),
  .press-print :deep(.article-body ol),
  .press-print :deep(.article-body blockquote) {
    orphans: 3;
    widows: 3;
  }

  .press-print :deep(.article-body a) {
    color: inherit !important;
    text-decoration: underline !important;
  }

  .press-print :deep(*) {
    box-shadow: none !important;
    text-shadow: none !important;
  }
}

.print-only {
  display: none;
}
</style>
