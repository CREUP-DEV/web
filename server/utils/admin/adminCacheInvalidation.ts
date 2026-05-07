async function clearAllCachedHandlers() {
  const storage = useStorage('cache')
  const keys = await storage.getKeys('nitro/handlers')
  await Promise.all(keys.map((key) => storage.removeItem(key)))
}

async function invalidateCachedHandlersMatching(substring: string) {
  const storage = useStorage('cache')
  const keys = await storage.getKeys('nitro/handlers')
  const matchingKeys = keys.filter((key) => key.includes(substring))

  if (matchingKeys.length === 0) {
    await clearAllCachedHandlers()
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

export async function invalidateNewsletterArchiveCache() {
  // Match any Nitro cached-handler key for this route (prefix-only clears can miss flattened keys).
  await invalidateCachedHandlersMatching('public-newsletter-archive')
}

/** Home carousel, newsletter archive, and press lists depend on site default images. */
export async function invalidateSiteDefaultImagesCaches() {
  await Promise.all([
    invalidateHomeDataCache(),
    invalidateNewsletterArchiveCache(),
    invalidatePressRelatedCaches(),
  ])
}
