import Redis from 'ioredis'

/**
 * Nitro `defineCachedEventHandler` stores entries in unstorage `cache` mount.
 * With Redis (see `server/plugins/runtime-cache-storage.ts`), keys use this base.
 */
const UNSTORAGE_CACHE_REDIS_BASE = 'creup:web:cache'

/** Mirrors unstorage `normalizeKey` for path segments. */
function normalizeUnstorageKeySegment(key: string) {
  return key.replace(/[:/\\]/g, ':').replace(/^[:/\\]|[:/\\]$/g, '')
}

function toRedisGlobPattern(relativeKeyPrefix: string) {
  return `${UNSTORAGE_CACHE_REDIS_BASE}:${normalizeUnstorageKeySegment(relativeKeyPrefix)}*`
}

/**
 * Deletes Nitro handler cache keys for the given unstorage-relative prefixes.
 * Use when a script runs outside Nitro (e.g. `pnpm db:seed`) after data changes
 * that affect `defineCachedEventHandler` responses.
 */
export async function purgeNitroHandlerCacheByPrefixes(
  redisUrl: string,
  relativeKeyPrefixes: string[]
) {
  const client = new Redis(redisUrl, {
    enableAutoPipelining: true,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  })

  try {
    await client.connect()

    for (const prefix of relativeKeyPrefixes) {
      const pattern = toRedisGlobPattern(prefix)
      let cursor = '0'

      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 500)
        cursor = nextCursor

        if (keys.length > 0) {
          await client.unlink(...keys)
        }
      } while (cursor !== '0')
    }
  } finally {
    try {
      await client.quit()
    } catch {
      client.disconnect()
    }
  }
}
