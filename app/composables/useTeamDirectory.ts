import { pickLocalizedValue } from '~~/shared/utils/locale'
import type { EnrichedMember, OrgArea, OrgMember } from '@/types/team'

interface UseTeamDirectoryOptions {
  areas: Ref<OrgArea[]>
}

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const useTeamDirectory = ({ areas }: UseTeamDirectoryOptions) => {
  const { t, locale } = useI18n()
  const { fallbackLocale } = useLocales()
  const localePath = useLocalePath()
  const { getDisplayName: getMemberDisplayName } = usePersonHelpers()

  const getAreaName = (area: OrgArea) =>
    pickLocalizedValue(area.nameTranslations ?? {}, locale.value, fallbackLocale) ?? area.name

  const buildMemberSlug = (member: OrgMember, area: OrgArea) => {
    const seed = `${area.id}-${member.order}-${member.name}-${member.surname}`
    return slugify(seed) || `${area.id}-${member.order}`
  }

  const toEnrichedMember = (
    member: OrgMember,
    area: OrgArea,
    isLeader: boolean
  ): EnrichedMember => ({
    ...member,
    areaName: getAreaName(area),
    areaId: area.id,
    isLeader,
    slug: buildMemberSlug(member, area),
  })

  const executiveMembers = computed<EnrichedMember[]>(() => {
    return areas.value
      .filter((area) => area.members.length > 0)
      .map((area) => toEnrichedMember(area.members[0]!, area, true))
  })

  const extendedMembers = computed<EnrichedMember[]>(() => {
    const result: EnrichedMember[] = []

    for (const area of areas.value) {
      for (let i = 1; i < area.members.length; i++) {
        result.push(toEnrichedMember(area.members[i]!, area, false))
      }
    }

    return result
  })

  const allMembers = computed<EnrichedMember[]>(() =>
    areas.value.flatMap((area) =>
      area.members.map((member, index) => toEnrichedMember(member, area, index === 0))
    )
  )

  const getMemberHref = (member: EnrichedMember) => localePath(`/conocenos/equipo/${member.slug}`)

  const getViewProfileAriaLabel = (fullName: string) => `${t('team.viewProfile')}: ${fullName}`
  const getPublicAgendaAriaLabel = (fullName: string) => `${t('team.publicAgenda')}: ${fullName}`

  const findMemberBySlug = (slug: string) =>
    allMembers.value.find((member) => member.slug === slug) ?? null

  return {
    allMembers,
    executiveMembers,
    extendedMembers,
    findMemberBySlug,
    getAreaName,
    getMemberDisplayName,
    getMemberHref,
    getPublicAgendaAriaLabel,
    getViewProfileAriaLabel,
    toEnrichedMember,
  }
}
