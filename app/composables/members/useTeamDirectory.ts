import { pickLocalizedValue } from '~~/shared/utils/locale'
import type { EnrichedMember, OrgArea, OrgMember } from '@/types/team'

interface UseTeamDirectoryOptions {
  areas: Ref<OrgArea[]>
}

const sortCommitteeResponsibleMembersLast = <T extends { isCommitteeResponsible: boolean }>(
  members: T[]
) => {
  const primaryMembers: T[] = []
  const committeeResponsibleMembers: T[] = []

  for (const member of members) {
    if (member.isCommitteeResponsible) {
      committeeResponsibleMembers.push(member)
      continue
    }

    primaryMembers.push(member)
  }

  return [...primaryMembers, ...committeeResponsibleMembers]
}

export const useTeamDirectory = ({ areas }: UseTeamDirectoryOptions) => {
  const { t, locale } = useI18n()
  const { fallbackLocale } = useLocales()
  const { getDisplayName: getMemberDisplayName } = usePersonHelpers()

  const getAreaName = (area: OrgArea) =>
    pickLocalizedValue(area.nameTranslations ?? {}, locale.value, fallbackLocale) ?? area.name

  const toEnrichedMember = (
    member: OrgMember,
    area: OrgArea,
    isLeader: boolean
  ): EnrichedMember => ({
    ...member,
    areaName: getAreaName(area),
    areaId: area.id,
    isLeader,
  })

  const executiveMembers = computed<EnrichedMember[]>(() => {
    return sortCommitteeResponsibleMembersLast(
      areas.value
        .filter((area) => area.members.length > 0)
        .map((area) => toEnrichedMember(area.members[0]!, area, true))
    )
  })

  const extendedMembers = computed<EnrichedMember[]>(() => {
    const result: EnrichedMember[] = []

    for (const area of areas.value) {
      for (let i = 1; i < area.members.length; i++) {
        result.push(toEnrichedMember(area.members[i]!, area, false))
      }
    }

    return sortCommitteeResponsibleMembersLast(result)
  })

  const allMembers = computed<EnrichedMember[]>(() =>
    areas.value.flatMap((area) =>
      area.members.map((member, index) => toEnrichedMember(member, area, index === 0))
    )
  )

  const getViewProfileAriaLabel = (fullName: string) => `${t('team.viewProfile')}: ${fullName}`
  const getPublicAgendaAriaLabel = (fullName: string) => `${t('team.publicAgenda')}: ${fullName}`

  return {
    allMembers,
    executiveMembers,
    extendedMembers,
    getAreaName,
    getMemberDisplayName,
    getPublicAgendaAriaLabel,
    getViewProfileAriaLabel,
    toEnrichedMember,
  }
}
