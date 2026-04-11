import type { OrgResponse } from '@/types/team'

export const useTeamPageData = async () => {
  const localeApiHeaders = useLocaleApiHeaders()

  const { data, error, pending, refresh } = await useFetch<OrgResponse>('/api/organigrama', {
    headers: localeApiHeaders,
    lazy: true,
  })

  return {
    areas: computed(() => data.value?.areas ?? []),
    error,
    pending,
    refresh,
  }
}
