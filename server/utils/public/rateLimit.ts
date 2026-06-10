import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getClientIp } from '../core/urlBuilder'
import { logError } from '../core/logger'
import { buildRedisKey, getRedisClient } from '../cache/redis'

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
    // Fail open so the site stays up, but alert: without a client IP we cannot
    // rate-limit at all. This helper is generic — each endpoint keeps its own gate
    // (Turnstile on the email forms, signed tokens on confirm/unsubscribe). Set
    // NUXT_TRUSTED_PROXY_CIDRS in production so getClientIp resolves a real IP.
    logError(
      'rate-limit.missing-ip',
      new Error('Rate limiting skipped: no client IP resolved'),
      { namespace: options.namespace },
      event
    )
    return
  }

  const redis = getRedisClient(event)
  const key = buildRedisKey('rate-limit', options.namespace, clientIp)
  let result: [number | string, number | string]

  try {
    result = (await redis.eval(RATE_LIMIT_INCREMENT_SCRIPT, 1, key, String(options.windowMs))) as [
      number | string,
      number | string,
    ]
  } catch (error) {
    // Fail open on a Redis outage so the site stays up, but alert. This helper is
    // generic; the email-sending endpoints (contact, newsletter-subscribe) still run
    // Turnstile independently as the abuse backstop, and token-based callers gate on
    // their own signed tokens.
    logError('rate-limit.redis-eval-failed', error, { namespace: options.namespace }, event)
    return
  }

  const count = Number(result[0])

  if (count > options.maxRequests) {
    throw createError({
      statusCode: 429,
      message: options.errorMessage,
    })
  }
}
