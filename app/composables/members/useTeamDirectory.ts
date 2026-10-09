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

/** The Intranet numbers an area's responsible 1 and its other members from 2. */
const AREA_RESPONSIBLE_ORDER = 1

/**
 * An area's responsible (Executive Committee) and its other members (Extended Executive Committee).
 * An area can be left without a responsible (the role ends before a replacement is named): the
 * Intranet then sends no member numbered 1, and every member is an ordinary one.
 */
const splitAreaMembers = (area: OrgArea) => {
  const [first, ...rest] = area.members

  return first?.order === AREA_RESPONSIBLE_ORDER
    ? { responsible: first, members: rest }
    : { responsible: null, members: area.members }
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

  const executiveMembers = computed<EnrichedMember[]>(() =>
    sortCommitteeResponsibleMembersLast(
      areas.value.flatMap((area) => {
        const { responsible } = splitAreaMembers(area)

        return responsible ? [toEnrichedMember(responsible, area, true)] : []
      })
    )
  )

  const extendedMembers = computed<EnrichedMember[]>(() =>
    sortCommitteeResponsibleMembersLast(
      areas.value.flatMap((area) =>
        splitAreaMembers(area).members.map((member) => toEnrichedMember(member, area, false))
      )
    )
  )

  const allMembers = computed<EnrichedMember[]>(() =>
    areas.value.flatMap((area) => {
      const { responsible } = splitAreaMembers(area)

      return area.members.map((member) => toEnrichedMember(member, area, member === responsible))
    })
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
    splitAreaMembers,
    toEnrichedMember,
  }
}
