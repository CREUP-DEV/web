import { SPAIN_REGION_PATHS } from '@/components/members/spainRegions'
import type {
  MembersResponse,
  OrganizationDetailModalData,
  OrganizationMember,
  SectorialMember,
  SectorialesResponse,
  SocialEntity,
} from '@/types/members'
import {
  getEmailData as resolveEmailData,
  getSocialButtons as resolveSocialButtons,
  getWebsiteData as resolveWebsiteData,
} from '~~/shared/utils/social'

interface UseMembersDirectoryOptions {
  members: Ref<OrganizationMember[]>
  sectoriales: Ref<SectorialMember[]>
  selectedCommunity?: Ref<string | null>
}

const normalizeComparable = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const isUniversidadGranada = (value: string) => {
  const normalized = normalizeComparable(value)
  return normalized === 'universidaddegranada' || normalized === 'universityofgranada'
}

export const useMembersDirectory = ({
  members,
  sectoriales,
  selectedCommunity: externalSelectedCommunity,
}: UseMembersDirectoryOptions) => {
  const { t, locale } = useI18n()
  const { getLanguageTag } = useLocales()

  const selectedCommunity = externalSelectedCommunity ?? ref<string | null>(null)

  const getCommunityLabel = (community: string, fallback?: string) => {
    const key = `members.communities.${community}`
    const translated = t(key)
    return translated === key ? (fallback ?? community) : translated
  }

  const getWebsiteData = (entity: SocialEntity) => resolveWebsiteData(entity.socialNetworks)
  const getEmailData = (entity: SocialEntity) => resolveEmailData(entity.socialNetworks)
  const getSocialButtons = (entity: SocialEntity) => resolveSocialButtons(entity.socialNetworks)

  const getEntityLogos = (entity: SocialEntity) => ({
    logoLight: entity.logoLight,
    logoDark: entity.logoDark,
  })

  const getMemberUniversityLabel = (member: OrganizationMember) =>
    member.university || t('members.unknownUniversity')

  const getMemberDenominationLabel = (member: OrganizationMember) =>
    member.denomination || t('members.unknownDenomination')

  const getMemberImageAlt = (member: OrganizationMember) =>
    `${getMemberUniversityLabel(member)}, ${getMemberDenominationLabel(member)}`

  const getMemberDetailsAriaLabel = (member: OrganizationMember) =>
    `${t('members.viewDetails')}: ${getMemberImageAlt(member)}`

  const getSectorialDenominationLabel = (sectorial: SectorialMember) =>
    sectorial.denomination || t('members.unknownDenomination')

  const getSectorialImageAlt = (sectorial: SectorialMember) =>
    getSectorialDenominationLabel(sectorial)

  const getSectorialDetailsAriaLabel = (sectorial: SectorialMember) =>
    `${t('members.sectoriales.viewDetails')}: ${getSectorialImageAlt(sectorial)}`

  const filteredMembers = computed(() => {
    if (!selectedCommunity.value) {
      return members.value
    }

    if (selectedCommunity.value === 'ceuta' || selectedCommunity.value === 'melilla') {
      return members.value.filter((member) => isUniversidadGranada(member.university))
    }

    return members.value.filter((member) => member.autonomousCommunity === selectedCommunity.value)
  })

  const memberCounts = computed(() => {
    const counts: Record<string, number> = {}

    for (const member of members.value) {
      counts[member.autonomousCommunity] = (counts[member.autonomousCommunity] ?? 0) + 1
    }

    const hasGranada = members.value.some((member) => isUniversidadGranada(member.university))
    const ceutaAndMelillaCount = hasGranada ? 1 : 0
    counts.ceuta = ceutaAndMelillaCount
    counts.melilla = ceutaAndMelillaCount

    return counts
  })

  const mapCommunities = Array.from(new Set(SPAIN_REGION_PATHS.map((region) => region.community)))

  const communityFilters = computed(() =>
    mapCommunities
      .map((community) => ({
        slug: community,
        label: getCommunityLabel(community),
        count: memberCounts.value[community] ?? 0,
      }))
      .filter((community) => community.count > 0)
      .sort((a, b) => a.label.localeCompare(b.label, getLanguageTag(locale.value)))
  )

  const sectionTitle = computed(() => {
    if (!selectedCommunity.value) {
      return t('members.allMembers')
    }

    return t('members.membersIn', {
      community: getCommunityLabel(selectedCommunity.value),
    })
  })

  const getMemberAnimationStyle = (index: number) => {
    const step = 50
    const maxDelay = 450
    const enterDelay = Math.min(index * step, maxDelay)

    return {
      '--member-enter-delay': `${Math.max(0, enterDelay)}ms`,
    }
  }

  const resolvedMemberLogos = computed(() => {
    const map = new Map<string, { logoLight: string | null; logoDark: string | null }>()
    for (const member of members.value) {
      map.set(member.id, getEntityLogos(member))
    }
    return map
  })

  const resolvedSectorialLogos = computed(() => {
    const map = new Map<string, { logoLight: string | null; logoDark: string | null }>()
    for (const sectorial of sectoriales.value) {
      map.set(sectorial.id, getEntityLogos(sectorial))
    }
    return map
  })

  const toModalData = (
    entity: OrganizationMember | SectorialMember,
    base: Omit<OrganizationDetailModalData, 'website' | 'email' | 'socialButtons'>
  ): OrganizationDetailModalData => {
    const website = getWebsiteData(entity)
    const email = getEmailData(entity)

    return {
      ...base,
      website,
      email,
      socialButtons: getSocialButtons(entity),
    }
  }

  const buildMemberDetailData = (member: OrganizationMember): OrganizationDetailModalData => {
    return toModalData(member, {
      eyebrow: getMemberUniversityLabel(member),
      heading: getMemberDenominationLabel(member),
      aboutTitle: t('members.descriptionLabel'),
      imageAlt: getMemberImageAlt(member),
      description: member.description,
      initials: member.initials,
      communityLabel: getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName),
      ...getEntityLogos(member),
    })
  }

  const buildSectorialDetailData = (sectorial: SectorialMember): OrganizationDetailModalData => {
    return toModalData(sectorial, {
      eyebrow: t('members.sectoriales.title'),
      heading: getSectorialDenominationLabel(sectorial),
      aboutTitle: t('members.descriptionLabel'),
      imageAlt: getSectorialImageAlt(sectorial),
      description: sectorial.description,
      initials: sectorial.initials,
      communityLabel: null,
      ...getEntityLogos(sectorial),
    })
  }

  const handleCommunitySelect = (community: string | null) => {
    selectedCommunity.value = community
  }

  return {
    buildMemberDetailData,
    buildSectorialDetailData,
    communityFilters,
    filteredMembers,
    getCommunityLabel,
    getMemberAnimationStyle,
    getMemberDenominationLabel,
    getMemberDetailsAriaLabel,
    getMemberImageAlt,
    getMemberUniversityLabel,
    getSectorialDenominationLabel,
    getSectorialDetailsAriaLabel,
    getSectorialImageAlt,
    handleCommunitySelect,
    memberCounts,
    resolvedMemberLogos,
    resolvedSectorialLogos,
    sectionTitle,
    selectedCommunity,
  }
}

export type { MembersResponse, OrganizationMember, SectorialMember, SectorialesResponse }
