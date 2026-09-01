import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/cache/externalApiCache'
import { getEventsPayload } from '../../utils/external/events'
import { fetchMandatesList, type MandateInfoOutput } from '../../utils/external/mandateDetail'
import { getRequiredExternalApiBaseUrl } from '../../utils/core/runtimeConfig'
import { logError } from '../../utils/core/logger'
import { buildLocalizedAlternatesForLocaleCodes } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../../utils/locale/requestLocale'

const SITEMAP_LAST_GOOD_KEY = 'sitemap:urls:last-good'
// 7 days: keep the snapshot well beyond any realistic upstream outage so we can
// serve it instead of a shrunken sitemap. Refreshed on every healthy generation.
const SITEMAP_LAST_GOOD_TTL_SECONDS = 60 * 60 * 24 * 7

const buildMandateSlug = (mandate: MandateInfoOutput, mandates: MandateInfoOutput[]) => {
  const year = mandate.startDate.slice(0, 4)
  if (mandates.every((entry) => entry.id === mandate.id || !entry.startDate.startsWith(year))) {
    return year
  }

  const yearMonth = mandate.startDate.slice(0, 7)
  if (
    mandates.every((entry) => entry.id === mandate.id || !entry.startDate.startsWith(yearMonth))
  ) {
    return yearMonth
  }

  return mandate.startDate
}

function buildI18nEntry(
  loc: string,
  locales: ReturnType<typeof getRequestLocaleContext>['locales'],
  defaultLocale: string,
  translatedLocales: Iterable<string> | null | undefined = locales.map((locale) => locale.code),
  extra: Record<string, unknown> = {}
) {
  return {
    loc,
    _i18n: {
      alternatives: buildLocalizedAlternatesForLocaleCodes(
        loc,
        locales,
        defaultLocale,
        translatedLocales
      ),
    },
    ...extra,
  }
}

export default defineSitemapEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)
  const { locales, defaultLocale } = getRequestLocaleContext(event)

  // Track whether every external source resolved. A failed source must not silently
  // shrink the sitemap (deindexing risk); on failure we serve the last-good snapshot.
  let externalSourcesHealthy = true

  const [eventsPayload, mandates] = await Promise.all([
    getEventsPayload(event).catch((error) => {
      logError('sitemap.events', error, undefined, event)
      externalSourcesHealthy = false
      return { events: [], generatedAt: null }
    }),
    (async () => {
      try {
        const externalBaseUrl = getRequiredExternalApiBaseUrl(event)
        return await fetchMandatesList(externalBaseUrl, cacheOptions)
      } catch (error) {
        logError('sitemap.mandates', error, undefined, event)
        externalSourcesHealthy = false
        return []
      }
    })(),
  ])

  const eventRoutes = eventsPayload.events.map((entry) =>
    buildI18nEntry(`/conocenos/eventos/${entry.slug}`, locales, defaultLocale, undefined, {
      lastmod: eventsPayload.generatedAt ?? undefined,
    })
  )

  const mandateRoutes = mandates.map((mandate) =>
    buildI18nEntry(
      `/conocenos/equipo/historico/${buildMandateSlug(mandate, mandates)}`,
      locales,
      defaultLocale
    )
  )

  const urls = [...eventRoutes, ...mandateRoutes]
  const storage = useStorage('cache')

  if (externalSourcesHealthy) {
    // Snapshot the complete set so a later upstream outage can be served from it.
    // Storage failures must never break sitemap generation — degrade to the fresh set.
    try {
      await storage.setItem(SITEMAP_LAST_GOOD_KEY, urls, { ttl: SITEMAP_LAST_GOOD_TTL_SECONDS })
    } catch (error) {
      logError('sitemap.snapshot.write', error, undefined, event)
    }
    return urls
  }

  // An external source failed. Serve the last known-good set instead of a shrunken
  // list. On partial failure this also discards the healthy source's fresh data —
  // a deliberate trade for "never shrink". Cold cache or storage error → fall back
  // to the fresh (degraded) set; never throw, or the module drops the whole source.
  try {
    const lastGood = await storage.getItem<typeof urls>(SITEMAP_LAST_GOOD_KEY)
    if (lastGood?.length) {
      return lastGood
    }
  } catch (error) {
    logError('sitemap.snapshot.read', error, undefined, event)
  }

  return urls
})
