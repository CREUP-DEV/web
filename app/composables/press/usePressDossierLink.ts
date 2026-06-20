import { PUBLIC_PRESS_DOSSIER_ASYNC_DATA_KEY } from '~~/shared/constants/publicAsyncDataKeys'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

type PressDossierResponse = {
  data: {
    pdfUrl: string
  } | null
}

export function usePressDossierLink() {
  return useAsyncData<string | null>(
    PUBLIC_PRESS_DOSSIER_ASYNC_DATA_KEY,
    async () => {
      const response = await $fetch<PressDossierResponse>('/api/press-dossier')
      return response.data?.pdfUrl ?? null
    },
    {
      default: () => null,
      getCachedData: publicCmsCachedData,
    }
  )
}
