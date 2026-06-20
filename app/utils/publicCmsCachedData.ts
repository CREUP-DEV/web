import type { NuxtApp } from '#app'

/**
 * Client-side cache policy for public CMS reads (press, home, transparency…).
 *
 * Goal: anonymous visitors keep fast, cached SPA navigation; admins see their edits immediately
 * without a reload.
 *
 * With `experimental.payloadExtraction`, `useAsyncData`'s default `getCachedData` reuses the
 * extracted payload (`nuxtApp.static.data`) on navigation and never refetches — and that store is
 * NOT cleared by `clearNuxtData`, so admin edits stayed stale until a hard reload.
 *
 * This policy reuses the cached payload (SSR `payload.data` or extracted `static.data`) and only
 * refetches when one of two things is true:
 *  - **Invalidation:** an admin save bumps a generation counter via `invalidatePublicCmsCache()`
 *    (wired through `usePublicCmsCacheRefresh`). Every key cached before the bump is now stale, so
 *    the next navigation refetches — even pages never visited this session whose `static.data` the
 *    code can't enumerate. Coarse on purpose: any admin save invalidates all public reads, which is
 *    the only way to guarantee freshness for the opaque extracted payload.
 *  - **Expiry:** the cached value is older than the TTL.
 *
 * A first, clean navigation (no prior fetch, no admin save yet) reuses the extracted/SSR payload —
 * fast, no refetch storm. The server always renders fresh, so this only governs client navigation.
 */
export const PUBLIC_CMS_CLIENT_TTL_MS = 60_000

let cacheGeneration = 0
const seen = new Map<string, { at: number; generation: number }>()

/** Invalidate every cached public read so the next navigation refetches. Called on admin saves. */
export function invalidatePublicCmsCache() {
  cacheGeneration += 1
}

export function publicCmsCachedData<T>(key: string, nuxtApp: NuxtApp): T | undefined {
  // The server renders fresh on every request; this cache only applies to client navigation.
  if (import.meta.server) {
    return undefined
  }

  // Fall back to the extracted payload only when there is genuinely no SSR value. `??` would treat a
  // real `null` (e.g. a deleted press dossier resolves to null) as "no data" and resurrect a stale
  // `static.data` entry, so distinguish `undefined` (absent) from `null` (a valid cached value).
  const payloadValue = nuxtApp.payload.data[key] as T | undefined
  const cached =
    payloadValue === undefined ? (nuxtApp.static.data[key] as T | undefined) : payloadValue
  if (cached === undefined) {
    return undefined
  }

  const markFresh = (value: T): T => {
    seen.set(key, { at: Date.now(), generation: cacheGeneration })
    return value
  }

  // The SSR payload delivered during hydration is current by definition.
  if (nuxtApp.isHydrating) {
    return markFresh(cached)
  }

  const entry = seen.get(key)

  // Reuse while the cached value is from the current generation and within the TTL window.
  if (
    entry &&
    entry.generation === cacheGeneration &&
    Date.now() - entry.at < PUBLIC_CMS_CLIENT_TTL_MS
  ) {
    return cached
  }

  // First clean hit with no admin mutation yet: trust the extracted/SSR payload (fast nav).
  if (!entry && cacheGeneration === 0) {
    return markFresh(cached)
  }

  // Invalidated (admin saved) or expired: refetch. Stamp now so the fresh result is reused next.
  seen.set(key, { at: Date.now(), generation: cacheGeneration })
  return undefined
}
