import { desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { newsletters, pressArticles } from '../../db/schema'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getEventsPayload } from '../../utils/events'
import { fetchMandatesList, type MandateInfoOutput } from '../../utils/mandateDetail'
import { getRequiredExternalApiBaseUrl } from '../../utils/runtimeConfig'
import { logError } from '../../utils/logger'

type PressArticleType = 'press_release' | 'statement' | 'media_appearance'

const pressArticleBasePath: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

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

/**
 * Build an i18n-aware sitemap entry for a given path.
 * With `prefix_except_default` strategy:
 *   - Spanish (default): /path
 *   - English:           /en/path
 */
function buildI18nEntry(loc: string, extra: Record<string, unknown> = {}) {
  return {
    loc,
    _i18n: {
      alternatives: [
        { hreflang: 'es', href: loc },
        { hreflang: 'en', href: `/en${loc}` },
        { hreflang: 'x-default', href: loc },
      ],
    },
    ...extra,
  }
}

export default defineSitemapEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)

  const [articles, eventsPayload, mandates, latestNewsletter] = await Promise.all([
    db.query.pressArticles.findMany({
      where: eq(pressArticles.active, true),
      columns: {
        slug: true,
        type: true,
        updatedAt: true,
        publishedAt: true,
      },
    }),
    getEventsPayload(event).catch((error) => {
      logError('sitemap.events', error, undefined, event)
      return { events: [], generatedAt: null }
    }),
    (async () => {
      try {
        const externalBaseUrl = getRequiredExternalApiBaseUrl(event)
        return await fetchMandatesList(externalBaseUrl, cacheOptions)
      } catch (error) {
        logError('sitemap.mandates', error, undefined, event)
        return []
      }
    })(),
    db
      .select({ updatedAt: newsletters.updatedAt })
      .from(newsletters)
      .where(eq(newsletters.active, true))
      .orderBy(desc(newsletters.updatedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  const articleRoutes = articles.flatMap((article) => {
    const basePath = pressArticleBasePath[article.type as PressArticleType]
    if (!basePath) {
      return []
    }

    return [
      buildI18nEntry(`${basePath}/${article.slug}`, {
        lastmod: (article.updatedAt ?? article.publishedAt).toISOString(),
      }),
    ]
  })

  const eventRoutes = eventsPayload.events.map((entry) =>
    buildI18nEntry(`/conocenos/eventos/${entry.slug}`, {
      lastmod: eventsPayload.generatedAt ?? undefined,
    })
  )

  const mandateRoutes = mandates.map((mandate) =>
    buildI18nEntry(`/conocenos/equipo/historico/${buildMandateSlug(mandate, mandates)}`)
  )

  const newsletterRoute = latestNewsletter
    ? [
        buildI18nEntry('/prensa/newsletter', {
          lastmod: latestNewsletter.updatedAt?.toISOString(),
        }),
      ]
    : []

  return [...articleRoutes, ...eventRoutes, ...mandateRoutes, ...newsletterRoute]
})
