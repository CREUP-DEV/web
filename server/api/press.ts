import { createError, setHeader } from 'h3'
import { eq, desc, and, inArray, sql, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, tags, pressArticleTags } from '../db/schema'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { logError } from '../utils/logger'
import { resolvePressTranslation } from '../utils/pressTranslation'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'
import { pressListQuerySchema, validateQuery } from '../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'

export default defineCachedEventHandler(
  async (event) => {
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const query = validateQuery(event, pressListQuerySchema)
    const type = query.type
    const tagSlug = query.tag
    const limit = query.limit
    const offset = query.offset

    try {
      const conditions: SQL[] = [eq(pressArticles.active, true)]

      if (type) {
        conditions.push(eq(pressArticles.type, type))
      }

      if (tagSlug && tagSlug !== 'all') {
        const articleIdsByTag = db
          .select({ pressArticleId: pressArticleTags.pressArticleId })
          .from(pressArticleTags)
          .innerJoin(tags, eq(pressArticleTags.tagId, tags.id))
          .where(eq(tags.slug, tagSlug))

        conditions.push(inArray(pressArticles.id, articleIdsByTag))
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

      const [articlesList, countResult] = await Promise.all([
        db.query.pressArticles.findMany({
          where: whereClause,
          orderBy: desc(pressArticles.publishedAt),
          limit,
          offset,
          with: {
            translations: true,
            tags: {
              with: {
                tag: {
                  with: { translations: true },
                },
              },
            },
            mediaOutlet: true,
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(pressArticles)
          .where(whereClause),
      ])

      const articles = articlesList.map((item) => {
        const trans = resolvePressTranslation(item.translations, locale, fallbackLocale)
        const articleTags = item.tags.map((pt) => {
          const tagTrans = pickLocalizedEntry(pt.tag.translations, locale, locales, fallbackLocale)
          return {
            slug: pt.tag.slug,
            name: tagTrans?.name ?? pt.tag.slug,
          }
        })

        return {
          id: item.id,
          type: item.type,
          slug: item.slug,
          image:
            toExternalImageProxyUrl(item.image, {
              publicPathBase: '/prensa/imagenes',
            }) ?? item.image,
          pdfUrl:
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/prensa/documentos',
            }) ?? item.pdfUrl,
          externalUrl: item.externalUrl,
          title: trans?.title ?? '',
          description: trans?.description ?? '',
          alt: trans?.alt ?? '',
          contentHtml: trans?.contentHtml ?? null,
          publishedAt: dateValueToDateOnly(item.publishedAt),
          tags: articleTags,
          mediaOutlet: item.mediaOutlet
            ? {
                name: item.mediaOutlet.name,
                logo:
                  toExternalImageProxyUrl(item.mediaOutlet.logo, {
                    publicPathBase: '/prensa/imagenes',
                  }) ?? item.mediaOutlet.logo,
                website: item.mediaOutlet.website,
              }
            : null,
        }
      })

      return { articles, total: countResult[0]?.count ?? 0 }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.press.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throw error
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-press', {
        queryKeys: ['type', 'tag', 'limit', 'offset'],
      }),
  }
)
