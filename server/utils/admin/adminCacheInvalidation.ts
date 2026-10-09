import { logError } from '../core/logger'
import { PUBLIC_CMS_CACHE_SCOPES, type PublicCmsCacheScope } from '../cache/publicRouteCache'

/**
 * Each public cached handler stores its entries under `nitro:handlers:<scope>:` in the `cache`
 * storage (the scope is its Nitro cache `name`, see `publicRouteCacheOptions`).
 */
const HANDLER_CACHE_BASE = 'nitro:handlers'

/**
 * Pages under the `swr` route rules in nuxt.config.ts: their HTML (`nitro:routes`) and the payload
 * Nuxt still extracts for cached routes and serves at `<page>/_payload.json` (`nuxt:payload`).
 * They embed admin content too (the default OG image on all of them; equality documents, financial
 * reports and the about hero on their own pages), and their keys are hashed paths, so they are
 * purged as a whole: there are only a handful, and they re-render on the next request.
 */
const PAGE_CACHE_BASES = ['nitro:routes', 'nuxt:payload'] as const

/**
 * A request whose cache miss started resolving before the mutation committed writes the old
 * payload back after the purge (Nitro also hands that one in-flight resolve to concurrent misses),
 * so every purge is repeated once this long after the first.
 */
const REPURGE_DELAY_MS = 3_000

async function removeCacheKeys(base: string) {
  const storage = useStorage('cache')
  const keys = await storage.getKeys(base)
  await Promise.all(keys.map((key) => storage.removeItem(key)))
}

async function purgeCacheBases(bases: readonly string[]) {
  await Promise.all(bases.map((base) => removeCacheKeys(base)))
}

/**
 * Purges the given cache bases now and once more shortly after. Never throws: callers run after the
 * mutation has committed, and failing the request would make the editor retry a save that already
 * went through (a create would be duplicated). A missed purge is bounded by the route cache maxAge.
 */
async function invalidateCacheBases(bases: readonly string[]) {
  const uniqueBases = [...new Set(bases)]

  try {
    await purgeCacheBases(uniqueBases)
  } catch (error) {
    logError('admin.cache-invalidation', error, { bases: uniqueBases })
  }

  const repurgeTimer = setTimeout(() => {
    purgeCacheBases(uniqueBases).catch((error) => {
      logError('admin.cache-invalidation.repurge', error, { bases: uniqueBases })
    })
  }, REPURGE_DELAY_MS)
  repurgeTimer.unref?.()
}

function handlerCacheBases(...scopes: PublicCmsCacheScope[]) {
  return scopes.map((scope) => `${HANDLER_CACHE_BASE}:${scope}`)
}

const PRESS_RELATED_SCOPES = [
  PUBLIC_CMS_CACHE_SCOPES.press,
  PUBLIC_CMS_CACHE_SCOPES.pressDetail,
  PUBLIC_CMS_CACHE_SCOPES.tags,
  PUBLIC_CMS_CACHE_SCOPES.home,
] as const

const ACTIVITY_RELATED_SCOPES = [
  PUBLIC_CMS_CACHE_SCOPES.activity,
  PUBLIC_CMS_CACHE_SCOPES.activityDetail,
  // The home payload carries the most recent activity.
  PUBLIC_CMS_CACHE_SCOPES.home,
] as const

const AREA_REPORTS_SCOPES = [
  PUBLIC_CMS_CACHE_SCOPES.areaReports,
  PUBLIC_CMS_CACHE_SCOPES.areaReportsMonths,
] as const

export async function invalidateHomeDataCache() {
  await invalidateCacheBases(handlerCacheBases(PUBLIC_CMS_CACHE_SCOPES.home))
}

export async function invalidateTagsCache() {
  await invalidateCacheBases(handlerCacheBases(PUBLIC_CMS_CACHE_SCOPES.tags))
}

/** Press list + detail, tags and home: all of them embed articles, tags and media outlets. */
export async function invalidatePressRelatedCaches() {
  await invalidateCacheBases(handlerCacheBases(...PRESS_RELATED_SCOPES))
}

export async function invalidateAboutPageCache() {
  await invalidateCacheBases([
    ...handlerCacheBases(PUBLIC_CMS_CACHE_SCOPES.aboutPage),
    ...PAGE_CACHE_BASES,
  ])
}

export async function invalidateEqualityDocumentsCache() {
  await invalidateCacheBases([
    ...handlerCacheBases(PUBLIC_CMS_CACHE_SCOPES.equalityDocuments),
    ...PAGE_CACHE_BASES,
  ])
}

export async function invalidateFinancialReportsCache() {
  await invalidateCacheBases([
    ...handlerCacheBases(PUBLIC_CMS_CACHE_SCOPES.financialReports),
    ...PAGE_CACHE_BASES,
  ])
}

/** Activity list + detail + home. */
export async function invalidateActivityRelatedCaches() {
  await invalidateCacheBases(handlerCacheBases(...ACTIVITY_RELATED_SCOPES))
}

/** Area reports and the month index they are browsed by. */
export async function invalidateAreaReportsCache() {
  await invalidateCacheBases(handlerCacheBases(...AREA_REPORTS_SCOPES))
}

/**
 * Home carousel, press, activity and area reports bake the configured site default images into
 * their payloads, and every page carries the default OG image.
 */
export async function invalidateSiteDefaultImagesCaches() {
  await invalidateCacheBases([
    ...handlerCacheBases(
      ...PRESS_RELATED_SCOPES,
      ...ACTIVITY_RELATED_SCOPES,
      ...AREA_REPORTS_SCOPES
    ),
    ...PAGE_CACHE_BASES,
  ])
}

/** Every admin-managed public cache, for changes made outside a single admin mutation. */
export async function invalidateAllPublicCmsCaches() {
  await invalidateCacheBases([
    ...handlerCacheBases(...Object.values(PUBLIC_CMS_CACHE_SCOPES)),
    ...PAGE_CACHE_BASES,
  ])
}

/**
 * Drops the HTML cached for the `swr` route rules. Run at startup: the route cache's integrity hash
 * does not change between builds, so pages cached by the previous image would otherwise keep
 * pointing at `/_nuxt/` assets the new one no longer ships.
 */
export async function purgePageCaches() {
  await purgeCacheBases(PAGE_CACHE_BASES)
}
