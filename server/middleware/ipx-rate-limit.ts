import { defineEventHandler, getRequestURL } from 'h3'
import { enforceRateLimit } from '../utils/public/rateLimit'
import { getClientIp, isIpTrusted } from '../utils/core/urlBuilder'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'

// /_ipx has nuxt-security's rate limiter disabled because a single page legitimately
// fires dozens of optimized-image requests at once. That left /_ipx as an uncapped
// outbound-fetch amplification path: a client can request many distinct external image
// URLs (or vary transforms to bust IPX's output cache), and IPX fetches each source from
// loopback — which the proxy-level limit (externalAssetProxy.ts) intentionally exempts.
//
// Cap /_ipx per real client IP with a deliberately high limit so normal browsing, and
// modest NAT sharing, never trip it while a single abuser's distinct-URL flood does.
// Keyed by getClientIp (spoof-resistant via the trusted-proxy walk), not nuxt-security's
// getIP. The value is a coarse amplification cap, not a tight limit; raise it if large
// shared-IP (corporate/university NAT) clients hit false positives.
const IPX_RATE_LIMIT_MAX = 1000
const IPX_RATE_LIMIT_WINDOW_MS = 60_000

export default defineEventHandler(async (event) => {
  if (!getRequestURL(event).pathname.startsWith('/_ipx/')) {
    return
  }

  const clientIp = getClientIp(event)
  if (clientIp && !isIpTrusted(clientIp)) {
    await enforceRateLimit(event, {
      namespace: 'ipx',
      maxRequests: IPX_RATE_LIMIT_MAX,
      windowMs: IPX_RATE_LIMIT_WINDOW_MS,
      errorMessage: getPublicApiErrorMessage(event, 'tooManyAttempts'),
    })
  }
})
