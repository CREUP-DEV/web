export default defineNuxtPlugin(async () => {
  const siteDefaultOgImage = useState<string | null>('site-default-og-image', () => null)

  const requestFetch = useRequestFetch()
  const response = await requestFetch<{ data: { image: string | null } }>('/api/site-default-og')
  siteDefaultOgImage.value = response.data.image
})
