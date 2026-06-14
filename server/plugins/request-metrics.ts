import type { H3Event } from 'h3'

import { recordRequestMetric } from '../utils/core/requestMetrics'

const REQUEST_START_KEY = 'requestMetricsStartedAt'
const REQUEST_RECORDED_KEY = 'requestMetricsRecorded'

function recordEvent(event: H3Event, statusCode: number) {
  const context = event.context as Record<string, unknown>

  // A request is counted once. Thrown errors fire the `error` hook while normal
  // responses fire `afterResponse`; the flag guards the rare case where both run
  // for the same event.
  if (context[REQUEST_RECORDED_KEY]) {
    return
  }
  context[REQUEST_RECORDED_KEY] = true

  const startedAt = context[REQUEST_START_KEY]

  recordRequestMetric({
    durationMs: typeof startedAt === 'number' ? Date.now() - startedAt : 0,
    method: event.method,
    path: event.path,
    statusCode,
  })
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    ;(event.context as Record<string, unknown>)[REQUEST_START_KEY] = Date.now()
  })

  // Successful and redirect responses reach this hook.
  nitroApp.hooks.hook('afterResponse', (event) => {
    recordEvent(event, event.node.res.statusCode)
  })

  // Thrown errors (createError, unmatched routes, SSR 404s) are sent by Nitro's
  // error handler, which marks the event handled and short-circuits h3 before
  // `afterResponse` runs. Without this hook every 4xx/5xx raised via `createError`
  // goes uncounted, leaving the admin status error counters stuck at zero.
  nitroApp.hooks.hook('error', (error, context) => {
    const event = context?.event

    if (!event) {
      return
    }

    const rawStatusCode = (error as { statusCode?: unknown }).statusCode
    const statusCode = typeof rawStatusCode === 'number' ? rawStatusCode : 500

    recordEvent(event, statusCode)
  })
})
