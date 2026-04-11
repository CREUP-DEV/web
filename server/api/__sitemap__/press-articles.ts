import { and, desc, eq, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { buildLocalizedAlternatesForLocaleCodes } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../../utils/requestLocale'

const PRESS_ARTICLE_BATCH_SIZE = 1000

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

function buildPressArticleWhereClause(cursor?: { publishedAt: string; id: string }) {
  const conditions: SQL[] = [
    eq(pressArticles.active, true),
    lte(pressArticles.publishedAt, sql`CURRENT_DATE`),
  ]

  if (cursor) {
    const cursorCondition = or(
      lt(pressArticles.publishedAt, cursor.publishedAt),
      and(eq(pressArticles.publishedAt, cursor.publishedAt), lt(pressArticles.id, cursor.id))
    )

    if (cursorCondition) {
      conditions.push(cursorCondition)
    }
  }

  return and(...conditions)
}

export default defineSitemapEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)
  const { locales, defaultLocale } = getRequestLocaleContext(event)

  const articleRoutes: ReturnType<typeof buildI18nEntry>[] = []
  let cursor: { publishedAt: string; id: string } | undefined

  // Read press articles in batches so the sitemap source never pulls the whole table at once.
  while (true) {
    const batch = await db.query.pressArticles.findMany({
      where: buildPressArticleWhereClause(cursor),
      columns: {
        id: true,
        slug: true,
        type: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: [desc(pressArticles.publishedAt), desc(pressArticles.id)],
      limit: PRESS_ARTICLE_BATCH_SIZE,
      with: {
        translations: {
          columns: {
            locale: true,
          },
        },
      },
    })

    if (batch.length === 0) {
      break
    }

    for (const article of batch) {
      const basePath = getPressArticlePublicListPath(article.type as PressArticleType)
      if (!basePath) {
        continue
      }

      articleRoutes.push(
        buildI18nEntry(
          `${basePath}/${article.slug}`,
          locales,
          defaultLocale,
          article.translations.map((translation) => translation.locale),
          { lastmod: new Date(article.updatedAt ?? article.publishedAt).toISOString() }
        )
      )
    }

    const lastArticle = batch[batch.length - 1]!
    cursor = {
      publishedAt: lastArticle.publishedAt,
      id: lastArticle.id,
    }

    if (batch.length < PRESS_ARTICLE_BATCH_SIZE) {
      break
    }
  }

  return articleRoutes
})
