import { createError, setHeader } from 'h3'
import { eq, desc, and, inArray, lte, sql, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, tags, pressArticleTags } from '../db/schema'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { logError } from '../utils/logger'
import { resolvePressTranslationSummary } from '../utils/pressTranslation'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
  setPublicRouteVaryHeaders,
} from '../utils/publicRouteCache'
import { pressListQuerySchema, validatePublicQuery } from '../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { throwSafePublicError } from '../utils/publicErrors'

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const query = validatePublicQuery(event, pressListQuerySchema)
    const type = query.type
    const tagSlug = query.tag
    const limit = query.limit
    const offset = query.offset

    try {
      const conditions: SQL[] = [
        eq(pressArticles.active, true),
        lte(pressArticles.publishedAt, sql`CURRENT_DATE`),
      ]

      if (type) {
        conditions.push(eq(pressArticles.type, type))
      }

      if (tagSlug) {
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
          // Secondary sort on createdAt breaks ties between same-day articles
          orderBy: [desc(pressArticles.publishedAt), desc(pressArticles.createdAt)],
          limit,
          offset,
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
                description: true,
                alt: true,
              },
            },
            tags: {
              with: {
                tag: {
                  with: {
                    translations: {
                      columns: {
                        locale: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            mediaOutlet: {
              columns: { name: true, logo: true, website: true },
            },
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(pressArticles)
          .where(whereClause),
      ])

      const items = articlesList.map((item) => {
        const trans = resolvePressTranslationSummary(item.translations, locale, fallbackLocale)
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
          image: item.image
            ? (toExternalImageProxyUrl(item.image, {
                publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
              }) ?? item.image)
            : null,
          pdfUrl:
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/prensa/documentos',
            }) ?? item.pdfUrl,
          externalUrl: item.externalUrl,
          title: trans?.title ?? '',
          description: trans?.description ?? '',
          alt: trans?.alt ?? '',
          publishedAt: dateValueToDateOnly(item.publishedAt),
          tags: articleTags,
          mediaOutlet: item.mediaOutlet
            ? {
                name: item.mediaOutlet.name,
                logo:
                  toExternalImageProxyUrl(item.mediaOutlet.logo, {
                    publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
                  }) ?? item.mediaOutlet.logo,
                website: item.mediaOutlet.website,
              }
            : null,
        }
      })

      return { items, total: countResult[0]?.count ?? 0 }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.press.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throwSafePublicError(event, 'public.press.unexpected-error', error)
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
