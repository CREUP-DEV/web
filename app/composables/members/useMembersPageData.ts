import type { MembersResponse, SectorialesResponse } from '@/types/members'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

export const useMembersPageData = async () => {
  const localeApiHeaders = useLocaleApiHeaders()

  const [
    { data: membersData, error: membersError, pending: membersPending, refresh: refreshMembers },
    {
      data: sectorialesData,
      error: sectorialesError,
      pending: sectorialesPending,
      refresh: refreshSectoriales,
    },
  ] = await Promise.all([
    useFetch<MembersResponse>('/api/members', {
      headers: localeApiHeaders,
      getCachedData: publicCmsCachedData,
    }),
    useFetch<SectorialesResponse>('/api/sectorials', {
      headers: localeApiHeaders,
      getCachedData: publicCmsCachedData,
    }),
  ])

  return {
    allMembers: computed(() => membersData.value?.data ?? []),
    allSectoriales: computed(() => sectorialesData.value?.data ?? []),
    pending: computed(() => membersPending.value || sectorialesPending.value),
    error: computed(() => membersError.value ?? sectorialesError.value ?? null),
    refresh: async () => {
      await Promise.all([refreshMembers(), refreshSectoriales()])
    },
  }
}
