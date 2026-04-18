type PressDossierResponse = {
  item: {
    pdfUrl: string
  } | null
}

export function usePressDossierLink() {
  return useAsyncData<string | null>(
    'public-layout-press-dossier-link',
    async () => {
      const response = await $fetch<PressDossierResponse>('/api/press-dossier')
      return response.item?.pdfUrl ?? null
    },
    {
      default: () => null,
    }
  )
}
