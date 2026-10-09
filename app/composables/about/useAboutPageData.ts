import { PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY } from '~~/shared/constants/publicAsyncDataKeys'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

interface AboutPageContent {
  heroImage: string | null
  heroVisible: boolean
}

interface AboutPageResponse {
  data: {
    content: AboutPageContent | null
    memberCount: number | null
  }
}

/** CREUP's foundation date, from which its age in the public figures is counted. */
export const CREUP_FOUNDATION_DATE = new Date(Date.UTC(2003, 9, 24))

/** Students CREUP represents, shown as "more than" this figure. */
export const CREUP_REPRESENTED_STUDENTS = 1_000_000

export type CreupStatKey = 'universities' | 'students' | 'years'
export type CreupValueKey =
  | 'independence'
  | 'cooperation'
  | 'nonDiscrimination'
  | 'socialCommitment'
  | 'participation'

/** Icons of the public figures, labelled by `aboutPage.stats.<key>`. */
export const CREUP_STAT_ICONS: Record<CreupStatKey, string> = {
  universities: 'i-tabler-building-community',
  students: 'i-tabler-school',
  years: 'i-tabler-calendar-stats',
}

/** CREUP's values in display order, described by `aboutPage.values.<key>`. */
export const CREUP_VALUES: ReadonlyArray<{ key: CreupValueKey; icon: string }> = [
  { key: 'independence', icon: 'i-tabler-scale' },
  { key: 'cooperation', icon: 'i-tabler-users-group' },
  { key: 'nonDiscrimination', icon: 'i-tabler-accessible' },
  { key: 'socialCommitment', icon: 'i-tabler-heart-handshake' },
  { key: 'participation', icon: 'i-tabler-message-circle-heart' },
]

/**
 * Lower bound shown for the member universities when no count is available: never as an exact
 * figure, only as `+30` or in "more than 30" wording.
 */
export const FALLBACK_MEMBER_COUNT = 30
export const FALLBACK_MEMBER_COUNT_LABEL = `+${FALLBACK_MEMBER_COUNT}`

/** Whole years elapsed since `since`, counted in UTC like the foundation date. */
export function getCompletedYearsSince(since: Date, now = new Date()) {
  let years = now.getUTCFullYear() - since.getUTCFullYear()
  const hasReachedAnniversary =
    now.getUTCMonth() > since.getUTCMonth() ||
    (now.getUTCMonth() === since.getUTCMonth() && now.getUTCDate() >= since.getUTCDate())

  if (!hasReachedAnniversary) {
    years -= 1
  }

  return Math.max(years, 0)
}

/**
 * The "Qué es CREUP" content (hero image) and CREUP's public figures: member universities (from
 * the members API count), represented students and years since the foundation. Shared by the about
 * page and the press kit so both show the same figures.
 */
export async function useAboutPageData() {
  const { locale } = useI18n()
  const { getLanguageTag } = useLocales()

  const { data, error, pending, refresh } = await useFetch<AboutPageResponse>('/api/about-page', {
    key: PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
    getCachedData: publicCmsCachedData,
  })

  // The API answers `memberCount: null` (with a 200) when the Intranet count is unavailable, which
  // is as unknown as a failed request: neither may be shown as an exact figure.
  const availableMemberCount = computed(() =>
    error.value ? null : (data.value?.data.memberCount ?? null)
  )
  const memberCountAvailable = computed(() => availableMemberCount.value !== null)
  const memberCount = computed(() => availableMemberCount.value ?? FALLBACK_MEMBER_COUNT)

  const formattedMemberCount = computed(() =>
    availableMemberCount.value === null
      ? FALLBACK_MEMBER_COUNT_LABEL
      : new Intl.NumberFormat(getLanguageTag(locale.value)).format(availableMemberCount.value)
  )

  const completedYears = computed(() => getCompletedYearsSince(CREUP_FOUNDATION_DATE))

  return {
    data,
    error,
    pending,
    refresh,
    heroImage: computed(() => data.value?.data.content?.heroImage ?? null),
    heroVisible: computed(() => data.value?.data.content?.heroVisible ?? false),
    /** The member universities count, or null when it is unavailable. */
    availableMemberCount,
    memberCountAvailable,
    /** The count, or the fallback lower bound for the count-up animation when unavailable. */
    memberCount,
    formattedMemberCount,
    fallbackMemberCountLabel: FALLBACK_MEMBER_COUNT_LABEL,
    completedYears,
  }
}
