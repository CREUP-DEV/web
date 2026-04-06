import { toAbsoluteUrl } from '~~/shared/utils/url'

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

  const canonicalUrl = computed(() => {
    const canonicalPath = resolveLiteralValue(options.canonicalPath) ?? route.path
    return toAbsoluteUrl(canonicalPath, String(siteConfig.url ?? '').trim()) ?? undefined
  })

  const ogImage = computed(() => {
    const imagePath = resolveLiteralValue(options.ogImage)
    return toAbsoluteUrl(imagePath, String(siteConfig.url ?? '').trim()) ?? undefined
  })

  const ogType = () => resolveLiteralValue(options.ogType) ?? 'website'
  const languageTag = computed(() => getLanguageTag(locale.value))

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: () => canonicalUrl.value,
    ogImage: () => ogImage.value,
    ogType,
    twitterCard: () => (ogImage.value ? 'summary_large_image' : 'summary'),
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: () => ogImage.value,
  })

  useHead(() => ({
    link: canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  }))

  useSchemaOrg([
    defineWebPage({
      '@id': () => (canonicalUrl.value ? `${canonicalUrl.value}#webpage` : undefined),
      name: title,
      description,
      url: () => canonicalUrl.value,
      inLanguage: () => languageTag.value,
    }),
  ])
}
