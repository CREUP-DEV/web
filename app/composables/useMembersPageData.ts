import type { MembersResponse, SectorialesResponse } from '@/types/members'

export const useMembersPageData = async () => {
  const localeApiHeaders = useLocaleApiHeaders()

  const [
    { data: membersData, error: membersError, pending: membersPending },
    { data: sectorialesData, error: sectorialesError, pending: sectorialesPending },
  ] = await Promise.all([
    useFetch<MembersResponse>('/api/members', {
      headers: localeApiHeaders,
      lazy: true,
    }),
    useFetch<SectorialesResponse>('/api/sectoriales', {
      headers: localeApiHeaders,
      lazy: true,
    }),
  ])

  return {
    allMembers: computed(() => membersData.value?.members ?? []),
    allSectoriales: computed(() => sectorialesData.value?.sectoriales ?? []),
    pending: computed(() => membersPending.value || sectorialesPending.value),
    error: computed(() => membersError.value ?? sectorialesError.value ?? null),
  }
}
