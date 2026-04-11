import type { H3Event } from 'h3'
import Redis from 'ioredis'
import { logError } from './logger'
import { getRequiredRedisUrl } from './runtimeConfig'

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

export async function tryAcquireRedisLock(
  namespace: string,
  key: string,
  ttlMs: number,
  event?: H3Event
) {
  const redis = getRedisClient(event)
  const lockToken = `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  const lockKey = buildRedisKey('lock', namespace, key)
  const result = await redis.set(lockKey, lockToken, 'PX', ttlMs, 'NX')

  if (result !== 'OK') {
    return null
  }

  return {
    key: lockKey,
    token: lockToken,
  }
}

export async function releaseRedisLock(lock: { key: string; token: string }, event?: H3Event) {
  const redis = getRedisClient(event)

  await redis.eval(
    `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      end
      return 0
    `,
    1,
    lock.key,
    lock.token
  )
}
