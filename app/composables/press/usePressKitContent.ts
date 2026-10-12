import type { Ref } from 'vue'
import {
  CREUP_REPRESENTED_STUDENTS,
  FALLBACK_MEMBER_COUNT,
  FALLBACK_MEMBER_COUNT_LABEL,
  type CreupStatKey,
} from '@/composables/about/useAboutPageData'
import type { Committee } from '@/types/committees'
import type { OrganizationMember, SectorialMember } from '@/types/members'
import type { OrgArea, OrgMember } from '@/types/team'

/** A member university or sectorial entity, as the press kit lists it. */
export interface PressKitTile {
  id: string
  logo: string | null
  title: string
  subtitle: string | null
  details: string | null
}

/** A member of the Executive Committee: the responsible of an area. */
export interface PressKitPerson {
  id: string
  name: string
  role: string
  photo: string | null
  degree: string | null
  university: string | null
  email: string | null
}

export interface PressKitAreaPerson {
  id: string
  name: string
  role: string | null
  photo: string | null
}

/** One area of the organization: its responsible and the members who report to them. */
export interface PressKitAreaRow {
  id: number
  name: string
  responsible: PressKitAreaPerson | null
  members: PressKitAreaPerson[]
}

export interface PressKitCommitteeItem {
  id: number
  name: string
  responsibleName: string | null
}

export interface PressKitPressContact {
  id: string
  name: string
  role: string
  email: string | null
  /** Base64 of the E.164 phone, as the org chart API sends it. */
  encodedPhone: string | null
}

const normalizeEmail = (email: string | null | undefined) => (email ?? '').trim().toLowerCase()

/**
 * The figures and text of "What is CREUP?". Without a member count, the figure reads "+30" and
 * the text "more than 30", never an exact number nobody counted.
 */
export function usePressKitAbout(sources: {
  universities: Ref<number | null>
  years: Ref<number>
}) {
  const { t, locale } = useI18n()
  const { getLanguageTag } = useLocales()

  const numberFormat = computed(() => new Intl.NumberFormat(getLanguageTag(locale.value)))
  const formattedStudents = computed(() => numberFormat.value.format(CREUP_REPRESENTED_STUDENTS))
  const formattedYears = computed(() => numberFormat.value.format(sources.years.value))
  const formattedUniversities = computed(() =>
    numberFormat.value.format(sources.universities.value ?? FALLBACK_MEMBER_COUNT)
  )

  const stats = computed(() =>
    (
      [
        {
          key: 'universities',
          value:
            sources.universities.value === null
              ? FALLBACK_MEMBER_COUNT_LABEL
              : formattedUniversities.value,
        },
        { key: 'students', value: `+${formattedStudents.value}` },
        {
          key: 'years',
          value: `${formattedYears.value} ${t('aboutPage.stats.years.suffix')}`,
        },
      ] satisfies Array<{ key: CreupStatKey; value: string }>
    ).map((stat) => ({ ...stat, label: t(`aboutPage.stats.${stat.key}.label`) }))
  )

  const paragraphs = computed(() => [
    t(
      sources.universities.value === null
        ? 'pressKit.about.paragraph1Approx'
        : 'pressKit.about.paragraph1',
      {
        universities: formattedUniversities.value,
        students: formattedStudents.value,
        years: formattedYears.value,
      }
    ),
    t('pressKit.about.paragraph2'),
    t('pressKit.about.paragraph3'),
    t('pressKit.about.paragraph4'),
  ])

  return { stats, paragraphs }
}

/**
 * What the press kit shows of the site's data, computed once for the page and its PDF so both
 * always list the same universities, people and committees in the same order and with the same
 * labels.
 */
export function usePressKitContent(sources: {
  members: Ref<OrganizationMember[]>
  sectorials: Ref<SectorialMember[]>
  areas: Ref<OrgArea[]>
  committees: Ref<Committee[]>
  getCommitteeName: (committee: Committee) => string
}) {
  const { locale } = useI18n()
  const { getLanguageTag } = useLocales()
  const {
    getCommunityLabel,
    getMemberDenominationLabel,
    getMemberUniversityLabel,
    getSectorialDenominationLabel,
  } = useMembersDirectory({ members: sources.members, sectoriales: sources.sectorials })
  const { executiveMembers, getAreaName, getMemberDisplayName, splitAreaMembers } =
    useTeamDirectory({ areas: sources.areas })

  const collator = computed(() => new Intl.Collator(getLanguageTag(locale.value)))
  const byTitle = (a: PressKitTile, b: PressKitTile) => collator.value.compare(a.title, b.title)

  const memberTiles = computed<PressKitTile[]>(() =>
    sources.members.value
      .map((member) => ({
        id: member.id,
        logo: member.logoLight ?? member.logoDark,
        title: getMemberUniversityLabel(member),
        subtitle: getMemberDenominationLabel(member) || null,
        details:
          [
            member.initials,
            getCommunityLabel(member.autonomousCommunity, member.autonomousCommunityName),
          ]
            .filter(Boolean)
            .join(' · ') || null,
      }))
      .sort(byTitle)
  )

  const sectorialTiles = computed<PressKitTile[]>(() =>
    sources.sectorials.value
      .map((sectorial) => ({
        id: sectorial.id,
        logo: sectorial.logoLight ?? sectorial.logoDark,
        title: getSectorialDenominationLabel(sectorial),
        subtitle: null,
        details: sectorial.initials || null,
      }))
      .sort(byTitle)
  )

  // The Executive Committee is each area's responsible, as on the team page.
  const executivePeople = computed<PressKitPerson[]>(() =>
    executiveMembers.value.map((member) => ({
      id: member.id,
      name: getMemberDisplayName(member),
      role: member.denomination || member.areaName,
      photo: member.photo,
      degree: member.degree,
      university: member.university,
      email: member.email || null,
    }))
  )

  const toAreaPerson = (member: OrgMember): PressKitAreaPerson => ({
    id: member.id,
    name: getMemberDisplayName(member),
    role: member.denomination,
    photo: member.photo,
  })

  // An area left without a responsible still lists its members; an empty one is left out.
  const areaRows = computed<PressKitAreaRow[]>(() =>
    sources.areas.value.flatMap((area) => {
      const { responsible, members } = splitAreaMembers(area)

      if (!responsible && members.length === 0) {
        return []
      }

      return [
        {
          id: area.id,
          name: getAreaName(area),
          responsible: responsible ? toAreaPerson(responsible) : null,
          members: members.map(toAreaPerson),
        },
      ]
    })
  )

  /** Org chart members the Intranet flags as the responsible of some committee. */
  const committeeResponsibleEmails = computed(
    () =>
      new Set(
        sources.areas.value
          .flatMap((area) => area.members)
          .filter((member) => member.isCommitteeResponsible)
          .map((member) => normalizeEmail(member.email))
          .filter(Boolean)
      )
  )

  /**
   * The committees API lists a committee's responsible first, numbered 1 (the other members
   * follow from 2), and the org chart flags that same person with `isCommitteeResponsible`:
   * either tells.
   */
  const getCommitteeResponsible = (committee: Committee) => {
    const [first] = committee.members

    if (!first) {
      return null
    }

    return first.order === 1 || committeeResponsibleEmails.value.has(normalizeEmail(first.email))
      ? first
      : null
  }

  const committeeItems = computed<PressKitCommitteeItem[]>(() =>
    sources.committees.value.map((committee) => {
      const responsible = getCommitteeResponsible(committee)

      return {
        id: committee.id,
        name: sources.getCommitteeName(committee),
        responsibleName: responsible ? getMemberDisplayName(responsible) : null,
      }
    })
  )

  // People the Intranet marks as press contacts, once each even if they sit in several areas.
  const pressContacts = computed<PressKitPressContact[]>(() => {
    const seen = new Set<string>()

    return sources.areas.value.flatMap((area) =>
      area.members.flatMap((member) => {
        const personKey = normalizeEmail(member.email) || member.id

        if (!member.pressContact || seen.has(personKey)) {
          return []
        }

        seen.add(personKey)

        return [
          {
            id: member.id,
            name: getMemberDisplayName(member),
            role: member.denomination || getAreaName(area),
            email: member.email || null,
            encodedPhone: member.encodedPhone,
          },
        ]
      })
    )
  })

  return {
    memberTiles,
    sectorialTiles,
    executivePeople,
    areaRows,
    committeeItems,
    pressContacts,
  }
}
