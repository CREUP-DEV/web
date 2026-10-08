import type { AsyncDataOptions, NuxtApp } from '#app'

/**
 * Client-side cache policy for public CMS reads (press, home, activity, transparency…), passed as
 * `getCachedData` to their `useAsyncData` / `useFetch`.
 *
 * Goal: anonymous visitors get fast SPA navigation; admins see their edits without a reload.
 *
 * Reads stay in `nuxtApp.payload.data` after their component unmounts (Nuxt does not purge reads
 * with a custom `getCachedData`). A component's initial fetch reuses that value while it is fresh:
 * fetched, or hydrated from the SSR payload, less than the TTL ago and after the last invalidation.
 * `invalidatePublicCmsCache()` (called on admin saves through `usePublicCmsCacheRefresh`) expires
 * every cached read at once, in this tab and, over a BroadcastChannel, in the site's other open tabs,
 * where `app/plugins/public-cms-cache-sync.client.ts` also refetches the reads on screen.
 *
 * Everything else fetches: a stale value, a changed watch source, and an explicit `refresh()` or
 * `refreshNuxtData()`, so a retry button never gets the cached value back. A miss drops the cached
 * value, so only a successful fetch stores one again: after a failed or aborted fetch (a deleted
 * article answers 404) the next navigation fetches instead of reviving the old value.
 *
 * Server renders bypass this policy. Pages under an `swr` route rule are served from cached HTML,
 * so their hydrated payload can be older than the request; admin saves purge that cache as well
 * (`server/utils/admin/adminCacheInvalidation.ts`).
 */
export const PUBLIC_CMS_CLIENT_TTL_MS = 60_000

const INVALIDATION_CHANNEL_NAME = 'creup-public-cms-cache'

type CachedDataContext = Parameters<NonNullable<AsyncDataOptions<unknown>['getCachedData']>>[2]

let cacheGeneration = 0
const fetchedAt = new Map<string, { at: number; generation: number }>()
let invalidationChannel: BroadcastChannel | null | undefined

/**
 * The tab's single invalidation channel, created on first use. A channel never receives its own
 * messages, so sharing one keeps the tab that invalidates from handling its own notice.
 */
function getInvalidationChannel() {
  if (invalidationChannel === undefined) {
    invalidationChannel =
      import.meta.client && typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(INVALIDATION_CHANNEL_NAME)
        : null
  }

  return invalidationChannel
}

/** Expire every cached public read, here and in the site's other open tabs. Called on admin saves. */
export function invalidatePublicCmsCache() {
  cacheGeneration += 1
  getInvalidationChannel()?.postMessage('invalidate')
}

/**
 * Run `onInvalidate` whenever another tab invalidates the cache, after expiring this tab's cached
 * reads (without notifying the other tabs again).
 */
export function onPublicCmsCacheInvalidatedElsewhere(onInvalidate: () => void) {
  getInvalidationChannel()?.addEventListener('message', () => {
    cacheGeneration += 1
    onInvalidate()
  })
}

export function publicCmsCachedData<T>(
  key: string,
  nuxtApp: NuxtApp,
  context: CachedDataContext
): T | undefined {
  if (import.meta.server) {
    return undefined
  }

  const cached = nuxtApp.payload.data[key] as T | undefined
  const markFetchedNow = () => {
    fetchedAt.set(key, { at: Date.now(), generation: cacheGeneration })
  }

  if (cached !== undefined && context.cause === 'initial') {
    // The SSR payload delivered during hydration is what the server just served.
    if (nuxtApp.isHydrating) {
      markFetchedNow()
      return cached
    }

    const entry = fetchedAt.get(key)

    // Reuse while the value was fetched in the current generation and within the TTL window.
    if (
      entry &&
      entry.generation === cacheGeneration &&
      Date.now() - entry.at < PUBLIC_CMS_CLIENT_TTL_MS
    ) {
      return cached
    }

    // An SSR payload value first read after hydration carries no date: trust it until the first
    // invalidation.
    if (!entry && cacheGeneration === 0) {
      markFetchedNow()
      return cached
    }
  }

  // Miss: a fetch follows. Drop the cached value so that only a successful fetch stores one again,
  // and date the entry from now so that result is reused for a whole TTL.
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = undefined
  }
  markFetchedNow()
  return undefined
}
