import { recordRequestMetric } from '../utils/core/requestMetrics'

const REQUEST_START_KEY = 'requestMetricsStartedAt'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    ;(event.context as Record<string, unknown>)[REQUEST_START_KEY] = Date.now()
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const startedAt = (event.context as Record<string, unknown>)[REQUEST_START_KEY]

    if (typeof startedAt !== 'number') {
      return
    }

    recordRequestMetric({
      durationMs: Date.now() - startedAt,
      method: event.method,
      path: event.path,
      statusCode: event.node.res.statusCode,
    })
  })
})
