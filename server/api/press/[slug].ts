import { createError, getRouterParam, setHeader } from 'h3'
import { and, eq, lte, sql } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'
import { pickLocalizedEntry, getBaseLanguage } from '~~/shared/utils/locale'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../../utils/externalAssetProxy'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import {
  getPressDefaultCoverEntriesRow,
  resolvePressArticleListImageWithVersion,
} from '../../utils/siteDefaultImages'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { isDatabaseUnavailableError } from '../../utils/databaseErrors'
import { getPublicApiErrorMessage } from '../../utils/apiErrorMessages'
import { throwSafePublicError } from '../../utils/publicErrors'
import { logError } from '../../utils/logger'
import { resolvePressTranslation } from '../../utils/pressTranslation'
import { getRequestLocaleContext } from '../../utils/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../../utils/publicRouteCache'
import { slugRouteParamSchema, validatePublicRouteParams } from '../../utils/validation'
import { appendAssetVersion } from '../../utils/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const { slug } = validatePublicRouteParams(event, slugRouteParamSchema)

    try {
      const [article, defaultCovers] = await Promise.all([
        db.query.pressArticles.findFirst({
          where: and(
            eq(pressArticles.slug, slug),
            eq(pressArticles.active, true),
            lte(pressArticles.publishedAt, sql`CURRENT_DATE`)
          ),
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
                description: true,
                alt: true,
                contentHtml: true,
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
              columns: {
                name: true,
                logo: true,
                website: true,
                updatedAt: true,
              },
            },
          },
        }),
        getPressDefaultCoverEntriesRow(),
      ])

      if (!article) {
        throw createError({
          statusCode: 404,
          message: getPublicApiErrorMessage(event, 'articleNotFound'),
        })
      }

      const trans = resolvePressTranslation(article.translations, locale, fallbackLocale)

      const articleTags = article.tags.map((pt) => {
        const tagTrans = pickLocalizedEntry(pt.tag.translations, locale, locales, fallbackLocale)
        return {
          slug: pt.tag.slug,
          name: tagTrans?.name ?? pt.tag.slug,
        }
      })

      // Collect the locale codes that have an actual native translation stored.
      const translatedLocales = article.translations
        .map((t) => getBaseLanguage(t.locale))
        .filter((code): code is string => !!code)

      return {
        article: {
          id: article.id,
          type: article.type,
          slug: article.slug,
          image: resolvePressArticleListImageWithVersion(
            article.type as PressArticleType,
            article.image,
            article.updatedAt,
            defaultCovers
          ),
          pdfUrl: appendAssetVersion(
            toExternalPdfProxyUrl(article.pdfUrl, {
              publicPathBase: '/prensa/documentos',
            }) ?? article.pdfUrl,
            article.updatedAt
          ),
          externalUrl: article.externalUrl,
          title: trans?.title ?? '',
          description: trans?.description ?? '',
          alt: trans?.alt ?? '',
          contentHtml: trans?.contentHtml ?? null,
          publishedAt: dateValueToDateOnly(article.publishedAt),
          updatedAt: article.updatedAt?.toISOString() ?? null,
          translatedLocales,
          tags: articleTags,
          mediaOutlet: article.mediaOutlet
            ? {
                name: article.mediaOutlet.name,
                logo: appendAssetVersion(
                  toExternalImageProxyUrl(article.mediaOutlet.logo, {
                    publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
                  }) ?? article.mediaOutlet.logo,
                  article.mediaOutlet.updatedAt
                ),
                website: article.mediaOutlet.website,
              }
            : null,
        },
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.press-detail.database-unavailable', error, { slug }, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throwSafePublicError(event, 'public.press-detail', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(
        event,
        `public-press-detail:${encodeURIComponent(getRouterParam(event, 'slug') ?? '')}`
      ),
  }
)
