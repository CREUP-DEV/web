import type { MaybeRefOrGetter } from 'vue'

export interface SeoAlternateLink extends Record<string, string> {
  id: string
  rel: 'alternate'
  hreflang: string
  href: string
}

export function useSeoAlternateLinksOverride(links: MaybeRefOrGetter<SeoAlternateLink[] | null>) {
  const override = useState<SeoAlternateLink[] | null>('seo-alternate-links-override', () => null)

  watchEffect(() => {
    override.value = toValue(links)
  })

  onBeforeUnmount(() => {
    override.value = null
  })
}
