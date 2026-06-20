import type { OrgResponse } from '@/types/team'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

export const useTeamPageData = async () => {
  const localeApiHeaders = useLocaleApiHeaders()

  const { data, error, pending, refresh } = await useFetch<OrgResponse>('/api/org-chart', {
    cache: 'no-store',
    headers: localeApiHeaders,
    lazy: true,
    getCachedData: publicCmsCachedData,
  })

  return {
    areas: computed(() => data.value?.data ?? []),
    error,
    pending,
    refresh,
  }
}
