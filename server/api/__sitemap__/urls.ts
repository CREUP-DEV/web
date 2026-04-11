import { desc, eq, lte, sql, and } from 'drizzle-orm'
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
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { buildLocalizedAlternatesForLocaleCodes } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../../utils/requestLocale'

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

  const [articles, eventsPayload, mandates, latestNewsletter] = await Promise.all([
    db.query.pressArticles.findMany({
      where: and(eq(pressArticles.active, true), lte(pressArticles.publishedAt, sql`CURRENT_DATE`)),
      columns: {
        slug: true,
        type: true,
        updatedAt: true,
        publishedAt: true,
      },
      with: {
        translations: {
          columns: {
            locale: true,
          },
        },
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
      .where(eq(newsletters.publicVisible, true))
      .orderBy(desc(newsletters.updatedAt))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ])

  const articleRoutes = articles.flatMap((article) => {
    const basePath = getPressArticlePublicListPath(article.type as PressArticleType)
    if (!basePath) {
      return []
    }

    return [
      buildI18nEntry(
        `${basePath}/${article.slug}`,
        locales,
        defaultLocale,
        article.translations.map((translation) => translation.locale),
        {
          lastmod: (article.updatedAt ?? article.publishedAt).toISOString(),
        }
      ),
    ]
  })

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

  const newsletterRoute = latestNewsletter
    ? [
        buildI18nEntry('/prensa/newsletter', locales, defaultLocale, undefined, {
          lastmod: latestNewsletter.updatedAt?.toISOString(),
        }),
      ]
    : []

  return [...articleRoutes, ...eventRoutes, ...mandateRoutes, ...newsletterRoute]
})
