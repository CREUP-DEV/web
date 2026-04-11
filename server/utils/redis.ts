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

export function createBullMqConnection(event?: H3Event) {
  const redisUrl = getRequiredRedisUrl(event)

  return new Redis(redisUrl, {
    enableAutoPipelining: true,
    maxRetriesPerRequest: null,
  })
}
