import type { PolicyDocument, PolicyDocumentsResponse } from '@/types/policy'
import { getPublicPressKitAsyncDataKey } from '~~/shared/constants/publicAsyncDataKeys'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

/** The public list endpoints cap `limit` at 50. */
const POLICY_DOCUMENTS_PAGE_SIZE = 50
/** Events come newest first, so the upcoming ones lead the first page. */
const UPCOMING_EVENTS_SCAN_LIMIT = 20
const UPCOMING_EVENTS_SHOWN = 3

async function fetchAllPositionPapers() {
  const fetchPage = (offset: number) =>
    $fetch<PolicyDocumentsResponse>('/api/position-papers', {
      query: { limit: POLICY_DOCUMENTS_PAGE_SIZE, offset },
    })

  const firstPage = await fetchPage(0)
  const remainingOffsets: number[] = []
  for (
    let offset = POLICY_DOCUMENTS_PAGE_SIZE;
    offset < firstPage.meta.total;
    offset += POLICY_DOCUMENTS_PAGE_SIZE
  ) {
    remainingOffsets.push(offset)
  }

  const remainingPages = await Promise.all(remainingOffsets.map(fetchPage))
  return [firstPage, ...remainingPages].flatMap((page) => page.data)
}

/** Every position paper, in the order the policy section lists them (all of them are in force). */
export function usePressKitPositionPapers() {
  const { data, pending, error, refresh } = useAsyncData<PolicyDocument[]>(
    getPublicPressKitAsyncDataKey('position-papers'),
    fetchAllPositionPapers,
    {
      default: () => [],
      getCachedData: publicCmsCachedData,
    }
  )

  return { positionPapers: data, pending, error, refresh }
}

/** The next few CREUP events, soonest first, including any taking place today. */
export function usePressKitUpcomingEvents() {
  const { events, error, status, refresh } = useEvents({ limit: UPCOMING_EVENTS_SCAN_LIMIT })
  const { isDateRangeUpcoming } = useDatePresets()

  const upcomingEvents = computed(() =>
    events.value
      .filter((event) => isDateRangeUpcoming(event.startDate, event.endDate))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, UPCOMING_EVENTS_SHOWN)
  )

  return {
    upcomingEvents,
    pending: computed(() => status.value === 'pending'),
    error,
    refresh,
  }
}
