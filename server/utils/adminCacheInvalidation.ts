// Nitro stores cached event handler results under the 'nitro/handlers' namespace.
// Clearing by prefix removes all locale-variant entries for a given handler.
async function invalidateCachedHandlerPrefix(prefix: string) {
  const storage = useStorage('cache')
  const keys = await storage.getKeys(prefix)
  await Promise.all(keys.map((key) => storage.removeItem(key)))
}

export async function invalidateHomeDataCache() {
  await invalidateCachedHandlerPrefix('nitro/handlers/api/home-data')
}

export async function invalidatePressCache() {
  await invalidateCachedHandlerPrefix('nitro/handlers/public-press')
}

export async function invalidateTagsCache() {
  await invalidateCachedHandlerPrefix('nitro/handlers/public-tags')
}

export async function invalidatePressRelatedCaches() {
  await Promise.all([invalidatePressCache(), invalidateTagsCache()])
}
