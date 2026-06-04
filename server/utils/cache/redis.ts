import type { H3Event } from 'h3'
import Redis from 'ioredis'
import { logError } from '../core/logger'
import { getRequiredRedisUrl } from '../core/runtimeConfig'

const REDIS_KEY_PREFIX = 'creup:web'

let redisClient: Redis | null = null
let redisClientUrl: string | null = null

const attachRedisListeners = (client: Redis) => {
  client.on('error', (error) => {
    logError('redis.client', error)
  })
}

export function buildRedisKey(namespace: string, ...parts: Array<string | number>) {
  return [REDIS_KEY_PREFIX, namespace, ...parts].join(':')
}

export function getRedisClient(event?: H3Event) {
  const redisUrl = getRequiredRedisUrl(event)

  if (redisClient && redisClientUrl && redisClientUrl !== redisUrl) {
    redisClient.disconnect()
    redisClient = null
    redisClientUrl = null
  }

  if (!redisClient || redisClientUrl !== redisUrl) {
    redisClient = new Redis(redisUrl, {
      enableAutoPipelining: true,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
    })
    redisClientUrl = redisUrl
    attachRedisListeners(redisClient)
  }

  return redisClient
}

export interface RedisServerStats {
  connectedClients: number | null
  evictedKeys: number | null
  hitRate: number | null
  keyspaceHits: number | null
  keyspaceMisses: number | null
  uptimeSeconds: number | null
  usedMemoryBytes: number | null
  usedMemoryHuman: string | null
}

const REDIS_STATS_ERROR_LOG_INTERVAL_MS = 5 * 60 * 1000
let lastRedisStatsErrorLoggedAt = 0

function parseRedisInfo(info: string) {
  const fields = new Map<string, string>()

  for (const line of info.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separator = trimmed.indexOf(':')
    if (separator === -1) {
      continue
    }

    fields.set(trimmed.slice(0, separator), trimmed.slice(separator + 1))
  }

  return fields
}

/**
 * Reads a snapshot of Redis server health via INFO. Returns null when Redis is
 * unreachable so callers can degrade gracefully instead of failing the request.
 */
export async function getRedisServerStats(event?: H3Event): Promise<RedisServerStats | null> {
  try {
    const info = await getRedisClient(event).info()
    const fields = parseRedisInfo(info)

    const toNumber = (key: string) => {
      const value = fields.get(key)
      if (value === undefined) {
        return null
      }

      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    const keyspaceHits = toNumber('keyspace_hits')
    const keyspaceMisses = toNumber('keyspace_misses')
    const totalLookups =
      keyspaceHits !== null && keyspaceMisses !== null ? keyspaceHits + keyspaceMisses : null

    return {
      connectedClients: toNumber('connected_clients'),
      evictedKeys: toNumber('evicted_keys'),
      hitRate:
        totalLookups && keyspaceHits !== null
          ? Number(((keyspaceHits / totalLookups) * 100).toFixed(1))
          : null,
      keyspaceHits,
      keyspaceMisses,
      uptimeSeconds: toNumber('uptime_in_seconds'),
      usedMemoryBytes: toNumber('used_memory'),
      usedMemoryHuman: fields.get('used_memory_human') ?? null,
    }
  } catch (error) {
    // Throttle: with the status page auto-refreshing, an unreachable Redis would
    // otherwise log on every poll just for having the page open.
    const now = Date.now()
    if (now - lastRedisStatsErrorLoggedAt >= REDIS_STATS_ERROR_LOG_INTERVAL_MS) {
      lastRedisStatsErrorLoggedAt = now
      logError('redis.stats', error)
    }
    return null
  }
}

export async function closeRedisClient() {
  if (!redisClient) {
    return
  }

  const client = redisClient
  redisClient = null
  redisClientUrl = null

  try {
    await client.quit()
  } catch {
    client.disconnect()
  }
}

export function createBullMqConnection(event?: H3Event) {
  const redisUrl = getRequiredRedisUrl(event)

  return new Redis(redisUrl, {
    enableAutoPipelining: true,
    maxRetriesPerRequest: null,
  })
}
