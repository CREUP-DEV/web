import type {
  OrganizationDetailModalData,
  OrganizationMember,
  SectorialMember,
} from '@/types/members'
import {
  getEmailData as resolveEmailData,
  getSocialButtons as resolveSocialButtons,
  getWebsiteData as resolveWebsiteData,
} from '~~/shared/utils/social'

export const useOrganizationDetailData = () => {
  const { t } = useI18n()

  const getCommunityLabel = (community: string, fallback?: string) => {
    const key = `members.communities.${community}`
    const translated = t(key)
    return translated === key ? (fallback ?? community) : translated
  }

  const getEntityLogos = (entity: { logoLight: string | null; logoDark: string | null }) => ({
    logoLight: entity.logoLight,
    logoDark: entity.logoDark,
  })

  const toModalData = (
    entity: {
      socialNetworks: OrganizationMember['socialNetworks']
      logoLight: string | null
      logoDark: string | null
    },
    base: Omit<OrganizationDetailModalData, 'website' | 'email' | 'socialButtons'>
  ): OrganizationDetailModalData => {
    const website = resolveWebsiteData(entity.socialNetworks)
    const email = resolveEmailData(entity.socialNetworks)

    return {
      ...base,
      website,
      email,
      socialButtons: resolveSocialButtons(entity.socialNetworks),
    }
  }

  const buildMemberDetailData = (member: OrganizationMember): OrganizationDetailModalData =>
    toModalData(member, {
      eyebrow: member.university || t('members.unknownUniversity'),
      heading: member.denomination || t('members.unknownDenomination'),
      aboutTitle: t('members.descriptionLabel'),
      imageAlt: `${member.university || t('members.unknownUniversity')}, ${
        member.denomination || t('members.unknownDenomination')
      }`,
      description: member.description,
      initials: member.initials,
      communityLabel: getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName),
      ...getEntityLogos(member),
    })

  const buildSectorialDetailData = (sectorial: SectorialMember): OrganizationDetailModalData =>
    toModalData(sectorial, {
      eyebrow: sectorial.initials || t('members.sectoriales.title'),
      heading: sectorial.denomination || t('members.unknownDenomination'),
      aboutTitle: t('members.descriptionLabel'),
      imageAlt: sectorial.denomination || t('members.unknownDenomination'),
      description: sectorial.description,
      initials: null,
      communityLabel: null,
      ...getEntityLogos(sectorial),
    })

  return {
    buildMemberDetailData,
    buildSectorialDetailData,
  }
}
