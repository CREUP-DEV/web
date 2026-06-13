import { createError, getRouterParam } from 'h3'
import { and, eq, lte, sql } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'
import { pickLocalizedEntry, getBaseLanguage } from '~~/shared/utils/locale'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import {
  toExternalImageProxyUrl,
  toExternalPdfProxyUrl,
} from '../../utils/external/externalAssetUrl'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import {
  getPressDefaultCoverEntriesRow,
  resolvePressArticleListImageWithVersion,
} from '../../utils/admin/siteDefaultImages'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { getPublicApiErrorMessage } from '../../utils/locale/apiErrorMessages'
import { throwPublicDatabaseAwareError } from '../../utils/public/publicErrors'
import { resolvePressTranslation } from '../../utils/press/pressTranslation'
import { getRequestLocaleContext } from '../../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../../utils/cache/publicRouteCache'
import { slugRouteParamSchema, validatePublicRouteParams } from '../../utils/validation'
import { appendAssetVersion } from '../../utils/core/assetVersion'

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
        data: {
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
              publicPathBase: PRESS_DOCUMENT_PUBLIC_PATH,
            }) ?? article.pdfUrl,
            article.updatedAt
          ),
          externalUrl: article.externalUrl,
          title: trans?.title ?? '',
          description: trans?.description ?? '',
          alt: trans?.alt ?? '',
          titleLocale: trans?.titleLocale ?? null,
          descriptionLocale: trans?.descriptionLocale ?? null,
          contentLocale: trans?.contentLocale ?? null,
          contentHtml: trans?.contentHtml ?? null,
          publishedAt: dateValueToDateOnly(article.publishedAt),
          updatedAt: article.updatedAt?.toISOString() ?? null,
          translatedLocales,
          tags: articleTags,
          mediaOutlet: article.mediaOutlet
            ? {
                name: article.mediaOutlet.name,
                logo: article.mediaOutlet.logo
                  ? appendAssetVersion(
                      toExternalImageProxyUrl(article.mediaOutlet.logo, {
                        publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
                      }) ?? article.mediaOutlet.logo,
                      article.mediaOutlet.updatedAt
                    )
                  : null,
                website: article.mediaOutlet.website,
              }
            : null,
        },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.press-detail', error, { slug })
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
