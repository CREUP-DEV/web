import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'
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

export default defineSitemapEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)

  const [articles, eventsPayload, mandates] = await Promise.all([
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
  ])

  const articleRoutes = articles.flatMap((article) => {
    const basePath = pressArticleBasePath[article.type as PressArticleType]
    if (!basePath) {
      return []
    }

    return [
      {
        loc: `${basePath}/${article.slug}`,
        lastmod: (article.updatedAt ?? article.publishedAt).toISOString(),
      },
    ]
  })

  const eventRoutes = eventsPayload.events.map((entry) => ({
    loc: `/conocenos/eventos/${entry.slug}`,
    lastmod: eventsPayload.generatedAt ?? undefined,
  }))

  const mandateRoutes = mandates.map((mandate) => ({
    loc: `/conocenos/equipo/historico/${buildMandateSlug(mandate, mandates)}`,
  }))

  return [...articleRoutes, ...eventRoutes, ...mandateRoutes]
})
