import type { MaybeRefOrGetter } from 'vue'
import { toAbsoluteUrl } from '~~/shared/utils/url'
import {
  createBreadcrumbStructuredData,
  createWebPageStructuredData,
  useStructuredData,
  type BreadcrumbStructuredDataItem,
  type StructuredDataNode,
  type WebPageSchemaType,
} from './useStructuredData'

type SeoOgType =
  | 'website'
  | 'article'
  | 'book'
  | 'profile'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_status'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other'

type SeoValue<T extends string = string> = T | (() => T | null | undefined)

interface UsePageSeoOptions {
  canonicalPath?: SeoValue
  ogImage?: SeoValue
  ogType?: SeoValue<SeoOgType>
  webPageType?: WebPageSchemaType
  breadcrumbs?: MaybeRefOrGetter<BreadcrumbStructuredDataItem[] | null | undefined>
}

const resolveLiteralValue = <T extends string>(value: SeoValue<T> | undefined): T | undefined => {
  if (typeof value === 'function') {
    return value() ?? undefined
  }

  if (typeof value === 'string') {
    return value
  }

  return undefined
}

const resolveTranslatedValue = (value: SeoValue, t: ReturnType<typeof useI18n>['t']) =>
  typeof value === 'function' ? (value() ?? undefined) : t(value)

export function usePageSeo(
  titleValue: SeoValue,
  descriptionValue: SeoValue,
  options: UsePageSeoOptions = {}
) {
  const { t, locale } = useI18n()
  const { getLanguageTag } = useLocales()
  const route = useRoute()
  const siteConfig = useSiteConfig()

  const title = () => resolveTranslatedValue(titleValue, t)
  const description = () => resolveTranslatedValue(descriptionValue, t)
  const explicitOgImage = computed(() => resolveLiteralValue(options.ogImage))
  const breadcrumbItems = computed(() => toValue(options.breadcrumbs) ?? null)

  const canonicalUrl = computed(() => {
    const canonicalPath = resolveLiteralValue(options.canonicalPath) ?? route.path
    return toAbsoluteUrl(canonicalPath, String(siteConfig.url ?? '').trim()) ?? undefined
  })

  const ogImage = computed(() => {
    const imagePath = explicitOgImage.value
    return toAbsoluteUrl(imagePath, String(siteConfig.url ?? '').trim()) ?? undefined
  })

  const ogType = () => resolveLiteralValue(options.ogType) ?? 'website'
  const languageTag = computed(() => getLanguageTag(locale.value))

  if (!explicitOgImage.value) {
    defineOgImage('NuxtSeo.satori', {
      title,
      description,
      brandTagline: () => t('ogImage.brandTagline'),
      sectionLabel: () => t('ogImage.sectionLabel'),
      statsEyebrow: () => t('ogImage.statsEyebrow'),
      statsHeadline: () => t('ogImage.statsHeadline'),
      supportText: () => t('ogImage.supportText'),
    })
  }

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: () => canonicalUrl.value,
    ogImage: () => ogImage.value,
    ogType,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: () => ogImage.value,
  })

  useHead(() => ({
    link: canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  }))

  useStructuredData(
    computed(() => {
      const nodes: StructuredDataNode[] = [
        createWebPageStructuredData({
          type: options.webPageType ?? 'WebPage',
          name: title() ?? '',
          description: description(),
          url: canonicalUrl.value,
          inLanguage: languageTag.value,
        }),
      ]

      if (breadcrumbItems.value?.length) {
        nodes.push(
          createBreadcrumbStructuredData(
            breadcrumbItems.value,
            String(siteConfig.url ?? '').trim() || null
          )
        )
      }

      return nodes
    })
  )
}
