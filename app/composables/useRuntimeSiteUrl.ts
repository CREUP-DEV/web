import { normalizeUrl } from '~~/shared/utils/url'

const DEFAULT_SITE_URL = 'https://www.creup.es'

export function useRuntimeSiteUrl() {
  const runtimeConfig = useRuntimeConfig()
  const siteConfig = useSiteConfig()

  return computed(() => {
    const runtimeSiteUrl = normalizeUrl(String(runtimeConfig.public.siteUrl ?? '').trim())
    const configuredSiteUrl = normalizeUrl(String(siteConfig.url ?? '').trim())

    return (runtimeSiteUrl || configuredSiteUrl || DEFAULT_SITE_URL).replace(/\/$/, '')
  })
}
