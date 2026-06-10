import { createError, getQuery, setHeader } from 'h3'
import { eq, desc, and, inArray, lte, sql, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, pressArticleTranslations, tags, pressArticleTags } from '../db/schema'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { isDatabaseUnavailableError } from '../utils/core/databaseErrors'
import { logError } from '../utils/core/logger'
import { resolvePressTranslationSummary } from '../utils/press/pressTranslation'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { pressListQuerySchema, validatePublicQuery } from '../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { throwSafePublicError } from '../utils/public/publicErrors'
import {
  getPressDefaultCoverEntriesRow,
  resolvePressArticleListImageWithVersion,
} from '../utils/admin/siteDefaultImages'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { appendAssetVersion } from '../utils/core/assetVersion'

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const query = validatePublicQuery(event, pressListQuerySchema)
    const type = query.type
    const typesParam = query.types
    const tagParam = query.tag
    const search = query.q?.trim()
    const limit = query.limit
    const offset = query.offset

    const typesList = typesParam
      ? typesParam
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is PressArticleType =>
            (['press_release', 'statement', 'media_appearance'] as string[]).includes(s)
          )
      : []

    const tagSlugs = tagParam
      ? tagParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    try {
      const conditions: SQL[] = [
        eq(pressArticles.active, true),
        lte(pressArticles.publishedAt, sql`CURRENT_DATE`),
      ]

      if (typesList.length > 0) {
        conditions.push(inArray(pressArticles.type, typesList))
      } else if (type) {
        conditions.push(eq(pressArticles.type, type))
      }

      if (tagSlugs.length > 0) {
        const articleIdsByTag = db
          .select({ pressArticleId: pressArticleTags.pressArticleId })
          .from(pressArticleTags)
          .innerJoin(tags, eq(pressArticleTags.tagId, tags.id))
          .where(inArray(tags.slug, tagSlugs))

        conditions.push(inArray(pressArticles.id, articleIdsByTag))
      }

      if (search) {
        const pattern = `%${escapeLikePattern(search)}%`
        const searchLocales = [...new Set([locale, fallbackLocale])]
        const articleIdsBySearch = db
          .select({ pressArticleId: pressArticleTranslations.pressArticleId })
          .from(pressArticleTranslations)
          .where(
            and(
              inArray(pressArticleTranslations.locale, searchLocales),
              sql`(${pressArticleTranslations.title} ilike ${pattern} escape '\\' or ${pressArticleTranslations.description} ilike ${pattern} escape '\\')`
            )
          )

        conditions.push(inArray(pressArticles.id, articleIdsBySearch))
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

      const [articlesList, countResult, defaultCovers] = await Promise.all([
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
              columns: { name: true, logo: true, website: true, updatedAt: true },
            },
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(pressArticles)
          .where(whereClause),
        getPressDefaultCoverEntriesRow(),
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
          image: resolvePressArticleListImageWithVersion(
            item.type as PressArticleType,
            item.image,
            item.updatedAt,
            defaultCovers
          ),
          pdfUrl: appendAssetVersion(
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/prensa/documentos',
            }) ?? item.pdfUrl,
            item.updatedAt
          ),
          externalUrl: item.externalUrl,
          title: trans?.title ?? '',
          description: trans?.description ?? '',
          alt: trans?.alt ?? '',
          publishedAt: dateValueToDateOnly(item.publishedAt),
          tags: articleTags,
          mediaOutlet: item.mediaOutlet
            ? {
                name: item.mediaOutlet.name,
                logo: item.mediaOutlet.logo
                  ? appendAssetVersion(
                      toExternalImageProxyUrl(item.mediaOutlet.logo, {
                        publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
                      }) ?? item.mediaOutlet.logo,
                      item.mediaOutlet.updatedAt
                    )
                  : null,
                website: item.mediaOutlet.website,
              }
            : null,
        }
      })

      return {
        data: items,
        meta: {
          total: countResult[0]?.count ?? 0,
        },
      }
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
    // Free-text search has unbounded cardinality, so never cache search responses
    // (and never mint a Redis key for them). Non-search lists stay cached as before.
    shouldBypassCache: (event) => {
      const raw = getQuery(event).q
      const q = Array.isArray(raw) ? raw[0] : raw
      return typeof q === 'string' && q.trim().length > 0
    },
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-press', {
        queryKeys: ['type', 'types', 'tag', 'limit', 'offset'],
      }),
  }
)
