import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getClientIp } from './urlBuilder'
import { logWarn } from './logger'
import { buildRedisKey, getRedisClient } from './redis'

interface RateLimitOptions {
  namespace: string
  maxRequests: number
  windowMs: number
  errorMessage: string
}

const RATE_LIMIT_INCREMENT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`

export async function enforceRateLimit(event: H3Event, options: RateLimitOptions): Promise<void> {
  const clientIp = getClientIp(event)

  if (!clientIp) {
    logWarn('rate-limit.missing-ip', { namespace: options.namespace }, event)
  }

  const redis = getRedisClient(event)
  const key = buildRedisKey('rate-limit', options.namespace, clientIp ?? 'unknown')
  const result = (await redis.eval(
    RATE_LIMIT_INCREMENT_SCRIPT,
    1,
    key,
    String(options.windowMs)
  )) as [number | string, number | string]
  const count = Number(result[0])

  if (count > options.maxRequests) {
    throw createError({
      statusCode: 429,
      message: options.errorMessage,
    })
  }
}
