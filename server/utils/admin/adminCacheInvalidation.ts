import { logWarn } from '../core/logger'

async function invalidateCachedHandlersMatching(substring: string) {
  const storage = useStorage('cache')
  const keys = await storage.getKeys('nitro/handlers')
  const matchingKeys = keys.filter((key) => key.includes(substring))

  // A zero-match is a no-op: warn (likely a renamed/typo'd prefix) instead of flushing every
  // cached handler, which used to mask the mistake and discard unrelated caches.
  if (matchingKeys.length === 0) {
    logWarn('admin.cache-invalidation.no-match', { substring })
    return
  }

  await Promise.all(matchingKeys.map((key) => storage.removeItem(key)))
}

export async function invalidatePressDetailCaches() {
  await invalidateCachedHandlersMatching('public-press-detail')
}

export async function invalidateHomeDataCache() {
  await invalidateCachedHandlersMatching('public-home')
}

export async function invalidatePressCache() {
  await invalidateCachedHandlersMatching('public-press')
}

export async function invalidateTagsCache() {
  await invalidateCachedHandlersMatching('public-tags')
}

export async function invalidatePressRelatedCaches() {
  await Promise.all([
    invalidatePressCache(),
    invalidateTagsCache(),
    invalidatePressDetailCaches(),
    invalidateHomeDataCache(),
  ])
}

export async function invalidatePressDossierCache() {
  await Promise.all([
    invalidateCachedHandlersMatching('press-dossier'),
    // Backward compatibility for any previously persisted cache keys.
    invalidateCachedHandlersMatching('public-press-dossier'),
  ])
}

export async function invalidateAboutPageCache() {
  await invalidateCachedHandlersMatching('about-page')
}

export async function invalidateEqualityDocumentsCache() {
  await invalidateCachedHandlersMatching('public-equality-documents')
}

export async function invalidateFinancialReportsCache() {
  await invalidateCachedHandlersMatching('public-financial-reports')
}

export async function invalidateActivityListCache() {
  await invalidateCachedHandlersMatching('public-activity')
}

export async function invalidateActivityDetailCaches() {
  await invalidateCachedHandlersMatching('public-activity-detail')
}

/** Activity list + detail + home (the home payload carries recent activity). */
export async function invalidateActivityRelatedCaches() {
  await Promise.all([
    invalidateActivityListCache(),
    invalidateActivityDetailCaches(),
    invalidateHomeDataCache(),
  ])
}

export async function invalidateAreaReportsCache() {
  await invalidateCachedHandlersMatching('public-area-reports')
}

export async function invalidateNewsletterArchiveCache() {
  // Match any Nitro cached-handler key for this route (prefix-only clears can miss flattened keys).
  await invalidateCachedHandlersMatching('public-newsletter-archive')
}

/**
 * Home carousel, newsletter archive, press lists, activity (list + detail) and area reports all
 * bake the configured site default image URL into their cached payloads, so changing a default in
 * admin must clear them. `invalidateActivityRelatedCaches` already covers the home payload.
 */
export async function invalidateSiteDefaultImagesCaches() {
  await Promise.all([
    invalidateHomeDataCache(),
    invalidateNewsletterArchiveCache(),
    invalidatePressRelatedCaches(),
    invalidateActivityRelatedCaches(),
    invalidateAreaReportsCache(),
  ])
}
