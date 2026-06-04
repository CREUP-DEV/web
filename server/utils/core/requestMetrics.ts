const REQUEST_RATE_WINDOW_MINUTES = 15
const SLOW_REQUEST_THRESHOLD_MS = 1_000
const MAX_SLOW_ENDPOINTS = 8

interface RequestRateBucket {
  admin: number
  api: number
  clientError: number
  minute: number
  public: number
  serverError: number
  total: number
}

interface EndpointStats {
  averageDurationMs: number
  key: string
  lastSeenAt: string
  maxDurationMs: number
  method: string
  path: string
  serverErrorCount: number
  serverErrorRate: number
  slowCount: number
  slowRate: number
  totalCount: number
}

interface MutableEndpointStats {
  lastSeenAt: string
  maxDurationMs: number
  method: string
  path: string
  serverErrorCount: number
  slowCount: number
  totalCount: number
  totalDurationMs: number
}

const rateBuckets = new Map<number, RequestRateBucket>()
const endpointStats = new Map<string, MutableEndpointStats>()

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
const CUID_LIKE_PATTERN = /\b[a-z0-9]{20,}\b/gi
const INTEGER_SEGMENT_PATTERN = /\/\d+(?=\/|$)/g

function getCurrentMinute(now = Date.now()) {
  return Math.floor(now / 60_000) * 60_000
}

function createEmptyBucket(minute: number): RequestRateBucket {
  return {
    admin: 0,
    api: 0,
    clientError: 0,
    minute,
    public: 0,
    serverError: 0,
    total: 0,
  }
}

function pruneRateBuckets(now = Date.now()) {
  const minimumMinute = getCurrentMinute(now) - (REQUEST_RATE_WINDOW_MINUTES - 1) * 60_000

  for (const minute of rateBuckets.keys()) {
    if (minute < minimumMinute) {
      rateBuckets.delete(minute)
    }
  }
}

function categorizePath(path: string) {
  if (path.startsWith('/api/admin/')) {
    return 'admin'
  }

  if (path.startsWith('/api/')) {
    return 'api'
  }

  return 'public'
}

function shouldTrackPath(path: string) {
  if (!path || path.startsWith('/_nuxt/') || path.startsWith('/__nuxt_error')) {
    return false
  }

  return true
}

function normalizePath(path: string) {
  return path
    .replace(UUID_PATTERN, ':id')
    .replace(CUID_LIKE_PATTERN, ':id')
    .replace(INTEGER_SEGMENT_PATTERN, '/:id')
}

export function recordRequestMetric(input: {
  durationMs: number
  method: string
  path: string
  statusCode: number
}) {
  if (!shouldTrackPath(input.path)) {
    return
  }

  const now = Date.now()
  const minute = getCurrentMinute(now)
  pruneRateBuckets(now)

  const bucket = rateBuckets.get(minute) ?? createEmptyBucket(minute)

  const category = categorizePath(input.path)
  const isServerError = input.statusCode >= 500
  const isClientError = !isServerError && input.statusCode >= 400
  const isSlow = input.durationMs >= SLOW_REQUEST_THRESHOLD_MS

  bucket.total += 1
  bucket[category] += 1
  if (isServerError) {
    bucket.serverError += 1
  } else if (isClientError) {
    bucket.clientError += 1
  }
  rateBuckets.set(minute, bucket)

  const normalizedPath = normalizePath(input.path)
  const endpointKey = `${input.method} ${normalizedPath}`
  const endpoint = endpointStats.get(endpointKey) ?? {
    lastSeenAt: new Date(now).toISOString(),
    maxDurationMs: 0,
    method: input.method,
    path: normalizedPath,
    serverErrorCount: 0,
    slowCount: 0,
    totalCount: 0,
    totalDurationMs: 0,
  }

  endpoint.totalCount += 1
  endpoint.totalDurationMs += input.durationMs
  endpoint.maxDurationMs = Math.max(endpoint.maxDurationMs, input.durationMs)
  endpoint.lastSeenAt = new Date(now).toISOString()

  if (isSlow) {
    endpoint.slowCount += 1
  }

  if (isServerError) {
    endpoint.serverErrorCount += 1
  }

  endpointStats.set(endpointKey, endpoint)
}

function buildRateWindowSummary(minutes: number) {
  const nowMinute = getCurrentMinute()
  const minimumMinute = nowMinute - (minutes - 1) * 60_000
  const buckets = [...rateBuckets.values()].filter((bucket) => bucket.minute >= minimumMinute)
  const totals = buckets.reduce(
    (acc, bucket) => {
      acc.admin += bucket.admin
      acc.api += bucket.api
      acc.public += bucket.public
      acc.clientError += bucket.clientError
      acc.serverError += bucket.serverError
      acc.total += bucket.total
      return acc
    },
    { admin: 0, api: 0, clientError: 0, public: 0, serverError: 0, total: 0 }
  )

  return {
    adminPerMinute: Number((totals.admin / minutes).toFixed(2)),
    apiPerMinute: Number((totals.api / minutes).toFixed(2)),
    clientError: totals.clientError,
    publicPerMinute: Number((totals.public / minutes).toFixed(2)),
    serverError: totals.serverError,
    total: totals.total,
    totalPerMinute: Number((totals.total / minutes).toFixed(2)),
  }
}

/**
 * Returns one entry per minute for the full retention window, chronologically
 * ordered and zero-filled for idle minutes, so the UI can draw a continuous
 * sparkline without inferring gaps.
 */
function buildRequestSeries() {
  const nowMinute = getCurrentMinute()

  return Array.from({ length: REQUEST_RATE_WINDOW_MINUTES }, (_, index) => {
    const minute = nowMinute - (REQUEST_RATE_WINDOW_MINUTES - 1 - index) * 60_000
    const bucket = rateBuckets.get(minute)

    return {
      clientError: bucket?.clientError ?? 0,
      minute,
      serverError: bucket?.serverError ?? 0,
      total: bucket?.total ?? 0,
    }
  })
}

export function getRequestMetricsSummary() {
  pruneRateBuckets()

  const lastMinuteBucket =
    rateBuckets.get(getCurrentMinute()) ?? createEmptyBucket(getCurrentMinute())

  const slowEndpoints: EndpointStats[] = [...endpointStats.entries()]
    .map(([key, endpoint]) => ({
      averageDurationMs: Number((endpoint.totalDurationMs / endpoint.totalCount).toFixed(2)),
      key,
      lastSeenAt: endpoint.lastSeenAt,
      maxDurationMs: endpoint.maxDurationMs,
      method: endpoint.method,
      path: endpoint.path,
      serverErrorCount: endpoint.serverErrorCount,
      serverErrorRate: Number(((endpoint.serverErrorCount / endpoint.totalCount) * 100).toFixed(1)),
      slowCount: endpoint.slowCount,
      slowRate: Number(((endpoint.slowCount / endpoint.totalCount) * 100).toFixed(1)),
      totalCount: endpoint.totalCount,
    }))
    .filter((endpoint) => endpoint.slowCount > 0 || endpoint.serverErrorCount > 0)
    // Sort by a combined problem score so error-heavy endpoints are not buried
    // under merely-slow ones (server errors weighted above slow responses).
    .sort((left, right) => {
      const leftScore = left.serverErrorCount * 2 + left.slowCount
      const rightScore = right.serverErrorCount * 2 + right.slowCount

      if (leftScore !== rightScore) {
        return rightScore - leftScore
      }

      if (left.averageDurationMs !== right.averageDurationMs) {
        return right.averageDurationMs - left.averageDurationMs
      }

      return right.maxDurationMs - left.maxDurationMs
    })
    .slice(0, MAX_SLOW_ENDPOINTS)

  return {
    requestRate: {
      last5Minutes: buildRateWindowSummary(5),
      last15Minutes: buildRateWindowSummary(15),
      lastMinute: {
        admin: lastMinuteBucket.admin,
        api: lastMinuteBucket.api,
        clientError: lastMinuteBucket.clientError,
        public: lastMinuteBucket.public,
        serverError: lastMinuteBucket.serverError,
        total: lastMinuteBucket.total,
      },
      series: buildRequestSeries(),
      slowRequestThresholdMs: SLOW_REQUEST_THRESHOLD_MS,
      windowMinutes: REQUEST_RATE_WINDOW_MINUTES,
    },
    slowEndpoints,
  }
}
