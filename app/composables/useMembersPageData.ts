import type { MembersResponse, SectorialesResponse } from '@/types/members'

export const useMembersPageData = async () => {
  const { t } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()

  const [
    { data: membersData, error: membersError },
    { data: sectorialesData, error: sectorialesError },
  ] = await Promise.all([
    useFetch<MembersResponse>('/api/members', {
      headers: localeApiHeaders,
    }),
    useFetch<SectorialesResponse>('/api/sectoriales', {
      headers: localeApiHeaders,
    }),
  ])

  const loadError = membersError.value ?? sectorialesError.value

  if (loadError) {
    throw createError({
      statusCode: loadError.statusCode === 404 ? 404 : 503,
      fatal: true,
      message: loadError.statusCode === 404 ? t('error.notFound') : t('members.loadError'),
    })
  }

  return {
    allMembers: computed(() => membersData.value?.members ?? []),
    allSectoriales: computed(() => sectorialesData.value?.sectoriales ?? []),
  }
}
