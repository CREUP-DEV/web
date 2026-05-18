export default defineNuxtPlugin(async () => {
  const siteDefaultOgImage = useState<string | null>('site-default-og-image', () => null)

  const { getSiteDefaultOgImageUrlWithVersion } =
    await import('~~/server/utils/admin/siteDefaultImages')
  siteDefaultOgImage.value = await getSiteDefaultOgImageUrlWithVersion()
})
