import type { Committee, CommitteesResponse } from '@/types/committees'
import { pickLocalizedValue } from '~~/shared/utils/locale'

/** The committees list (`/api/committees`) with locale-aware name and description getters. */
export const useCommitteesData = () => {
  const { locale } = useI18n()
  const { fallbackLocale } = useLocales()
  const localeApiHeaders = useLocaleApiHeaders()

  const { data, pending, error, refresh } = useFetch<CommitteesResponse>('/api/committees', {
    cache: 'no-store',
    headers: localeApiHeaders,
  })

  const getCommitteeName = (committee: Committee) =>
    pickLocalizedValue(committee.nameTranslations ?? {}, locale.value, fallbackLocale) ??
    committee.name

  const getCommitteeDescription = (committee: Committee) =>
    pickLocalizedValue(committee.descriptionTranslations ?? {}, locale.value, fallbackLocale) ??
    committee.description ??
    ''

  return {
    committees: computed(() => data.value?.data ?? []),
    pending,
    error,
    refresh,
    getCommitteeName,
    getCommitteeDescription,
  }
}
