<script setup lang="ts">
/**
 * PressArticleDetail
 * Shared detail view for a press article (press release, statement, media appearance)
 * Displays full article with SEO metadata, cover image, description, tags, and type-specific content
 */
import type { PressArticle, PressArticleType } from '@/composables/usePress'

type ShareAction = {
  key: string
  label: string
  icon: string
  class?: string
  to?: string
  onClick?: () => void | Promise<void>
}

const props = defineProps<{
  article: PressArticle
  /** Back link URL */
  backTo: string
  /** Back link label */
  backLabel: string
}>()

const { t } = useI18n()
const toast = useToast()
const { formatDate: formatLocaleDate } = useLocaleFormatting()
const canNativeShare = ref(false)

onMounted(() => {
  canNativeShare.value = typeof navigator.share === 'function'
})

const formatDate = (iso: string) => {
  return formatLocaleDate(iso, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const typeUrlPrefix: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

const canonicalUrl = computed(
  () => `https://www.creup.es${typeUrlPrefix[props.article.type]}/${props.article.slug}`
)

// Social sharing
const shareText = computed(() => props.article.title)
const twitterShareUrl = computed(
  () =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl.value)}&text=${encodeURIComponent(shareText.value)}`
)
const linkedinShareUrl = computed(
  () =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl.value)}`
)
const facebookShareUrl = computed(
  () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl.value)}`
)
const telegramShareUrl = computed(
  () =>
    `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl.value)}&text=${encodeURIComponent(shareText.value)}`
)
const whatsappShareUrl = computed(
  () => `https://wa.me/?text=${encodeURIComponent(`${shareText.value} ${canonicalUrl.value}`)}`
)
const emailShareUrl = computed(
  () =>
    `mailto:?subject=${encodeURIComponent(shareText.value)}&body=${encodeURIComponent(`${shareText.value}\n\n${canonicalUrl.value}`)}`
)
// Instagram and TikTok do not provide web-based share URLs — sharing is mobile-only on those platforms.
const shareNative = async () => {
  if (!import.meta.client || !navigator.share) return
  try {
    await navigator.share({
      title: shareText.value,
      text: shareText.value,
      url: canonicalUrl.value,
    })
  } catch {
    // User cancelled share dialog
  }
}

const copyLink = async () => {
  if (!import.meta.client || !navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(canonicalUrl.value)
    toast.add({
      title: t('press.copy.success'),
      color: 'success',
    })
  } catch {
    toast.add({
      title: t('press.copy.error'),
      color: 'error',
    })
  }
}

const printPage = () => {
  if (!import.meta.client) return
  window.print()
}

const shareActions = computed<ShareAction[]>(() => {
  const actions: ShareAction[] = [
    {
      key: 'copy',
      label: t('press.shareActions.copy'),
      icon: 'i-tabler-link',
      onClick: copyLink,
    },
    {
      key: 'whatsapp',
      label: t('press.shareActions.whatsapp'),
      icon: 'i-tabler-brand-whatsapp',
      to: whatsappShareUrl.value,
    },
    {
      key: 'x',
      label: t('press.shareActions.x'),
      icon: 'i-tabler-brand-x',
      to: twitterShareUrl.value,
    },
    {
      key: 'linkedin',
      label: t('press.shareActions.linkedin'),
      icon: 'i-tabler-brand-linkedin',
      to: linkedinShareUrl.value,
    },
    {
      key: 'facebook',
      label: t('press.shareActions.facebook'),
      icon: 'i-tabler-brand-facebook',
      to: facebookShareUrl.value,
    },
    {
      key: 'telegram',
      label: t('press.shareActions.telegram'),
      icon: 'i-tabler-brand-telegram',
      to: telegramShareUrl.value,
    },
    {
      key: 'email',
      label: t('press.shareActions.email'),
      icon: 'i-tabler-mail',
      to: emailShareUrl.value,
    },
    {
      key: 'print',
      label: t('press.shareActions.print'),
      icon: 'i-tabler-printer',
      onClick: printPage,
    },
  ]

  if (canNativeShare.value) {
    actions.splice(
      2,
      0,
      {
        key: 'instagram',
        label: t('press.shareActions.instagram'),
        icon: 'i-tabler-brand-instagram',
        class: 'sm:hidden',
        onClick: shareNative,
      },
      {
        key: 'tiktok',
        label: t('press.shareActions.tiktok'),
        icon: 'i-tabler-brand-tiktok',
        class: 'sm:hidden',
        onClick: shareNative,
      }
    )
  }

  return actions
})

const externalLinkLabel = computed(() => {
  if (props.article.type === 'media_appearance') {
    return t('press.readOriginal')
  }
  return t('press.readFull')
})

// SEO meta
useSeoMeta({
  title: () => props.article.title,
  description: () => props.article.description,
  ogTitle: () => props.article.title,
  ogDescription: () => props.article.description,
  ogImage: () =>
    props.article.image.startsWith('http')
      ? props.article.image
      : `https://www.creup.es${props.article.image}`,
  ogType: 'article',
  ogUrl: () => canonicalUrl.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => props.article.title,
  twitterDescription: () => props.article.description,
})

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
})
</script>

<template>
  <article class="press-print py-8 sm:py-12">
    <UContainer class="max-w-4xl">
      <!-- Back link -->
      <nav class="no-print mb-6">
        <NuxtLink
          :to="backTo"
          class="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <UIcon name="i-tabler-arrow-left" class="size-4" />
          {{ backLabel }}
        </NuxtLink>
      </nav>

      <!-- Header -->
      <header class="mb-8">
        <!-- Date and media outlet -->
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
              <NuxtImg
                :src="article.mediaOutlet.logo"
                :alt="article.mediaOutlet.name"
                class="inline-block h-4 w-auto"
              />
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

        <!-- Tags -->
        <div v-if="article.tags.length" class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="tag in article.tags"
            :key="tag.slug"
            class="bg-secondary/10 text-secondary rounded-full px-3 py-1 text-sm"
          >
            {{ tag.name }}
          </span>
        </div>
      </header>

      <!-- Cover image -->
      <figure class="mb-8">
        <div class="bg-muted overflow-hidden rounded-xl">
          <NuxtImg
            :src="article.image"
            :alt="article.alt || article.title"
            width="960"
            height="540"
            class="w-full object-cover"
          />
        </div>
      </figure>

      <!-- Description -->
      <div v-if="article.description" class="prose prose-lg dark:prose-invert mb-8 max-w-none">
        <p class="text-lg leading-relaxed">{{ article.description }}</p>
      </div>

      <!-- Action buttons -->
      <div class="no-print flex flex-wrap gap-3">
        <!-- PDF download for press releases and statements -->
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

        <!-- External link for media appearances / full article -->
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

      <!-- Share buttons -->
      <div class="no-print mt-8 border-t pt-6">
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

  .press-print :deep(*) {
    box-shadow: none !important;
    text-shadow: none !important;
  }
}

.print-only {
  display: none;
}
</style>
