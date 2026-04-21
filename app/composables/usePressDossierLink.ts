import { PUBLIC_PRESS_DOSSIER_ASYNC_DATA_KEY } from '~~/shared/constants/publicAsyncDataKeys'

type PressDossierResponse = {
  item: {
    pdfUrl: string
  } | null
}

export function usePressDossierLink() {
  return useAsyncData<string | null>(
    PUBLIC_PRESS_DOSSIER_ASYNC_DATA_KEY,
    async () => {
      const response = await $fetch<PressDossierResponse>('/api/press-dossier')
      return response.item?.pdfUrl ?? null
    },
    {
      default: () => null,
    }
  )
}
