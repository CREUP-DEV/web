import { createError, setHeader } from 'h3'
import { and, asc, desc, eq, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { carouselItems, featuredLinks, pressArticles } from '../db/schema'
import { appendAssetVersion } from '../utils/core/assetVersion'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { isDatabaseUnavailableError } from '../utils/core/databaseErrors'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { logError } from '../utils/core/logger'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  getPressDefaultCoverEntriesRow,
  loadSiteDefaultImageEntriesMap,
  resolvePressArticleListImageWithVersion,
  resolveSiteDefaultImageUrlWithVersion,
} from '../utils/admin/siteDefaultImages'
import { resolvePressTranslationSummary } from '../utils/press/pressTranslation'
import { throwSafePublicError } from '../utils/public/publicErrors'
import { HOME_IMAGE_PUBLIC_BASE, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { pickLocalizedEntry } from '~~/shared/utils/locale'

const HOME_FEATURED_PRESS_LIMIT = 4

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event, {
      sharedMaxAgeSeconds: 5,
      staleWhileRevalidateSeconds: 5,
    })
    setPublicRouteVaryHeaders(event)

    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)

    try {
      const [
        carouselItemsList,
        linkItemsList,
        pressItemsList,
        siteDefaultImageEntries,
        pressDefaultCovers,
      ] = await Promise.all([
        db.query.carouselItems.findMany({
          where: eq(carouselItems.active, true),
          orderBy: [asc(carouselItems.order), asc(carouselItems.id)],
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
                buttonText: true,
                alt: true,
              },
            },
          },
        }),
        db.query.featuredLinks.findMany({
          where: eq(featuredLinks.active, true),
          orderBy: [asc(featuredLinks.order), asc(featuredLinks.id)],
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
                alt: true,
              },
            },
          },
        }),
        db.query.pressArticles.findMany({
          where: and(
            eq(pressArticles.active, true),
            lte(pressArticles.publishedAt, sql`CURRENT_DATE`)
          ),
          orderBy: [desc(pressArticles.publishedAt), desc(pressArticles.createdAt)],
          limit: HOME_FEATURED_PRESS_LIMIT,
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
        loadSiteDefaultImageEntriesMap(),
        getPressDefaultCoverEntriesRow(),
      ])

      const defaultCarouselImage = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.carousel,
        SITE_DEFAULT_IMAGE_SLOT.carouselSlide
      )

      const carousel = carouselItemsList.map((item) => {
        const translation = pickLocalizedEntry(
          item.translations,
          locale,
          locales,
          fallbackLocale
        ) || {
          title: '',
          buttonText: '',
          alt: null,
        }
        const resolvedImage = item.image
          ? appendAssetVersion(
              toExternalImageProxyUrl(item.image, {
                publicPathBase: HOME_IMAGE_PUBLIC_BASE,
              }) ?? item.image,
              item.updatedAt
            )
          : defaultCarouselImage

        return {
          image: resolvedImage,
          href: item.href,
          title: translation.title,
          buttonText: translation.buttonText,
          alt: (translation as { alt?: string | null }).alt ?? '',
        }
      })

      const featuredLinksList = linkItemsList.map((item) => {
        const translation = pickLocalizedEntry(
          item.translations,
          locale,
          locales,
          fallbackLocale
        ) || {
          title: '',
          alt: null,
        }

        return {
          image: appendAssetVersion(
            toExternalImageProxyUrl(item.image, {
              publicPathBase: HOME_IMAGE_PUBLIC_BASE,
            }) ?? item.image,
            item.updatedAt
          ),
          to: item.to,
          title: translation.title,
          alt: (translation as { alt?: string | null }).alt ?? '',
        }
      })

      const featuredPressItems = pressItemsList.map((item) => {
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
          path: `${getPressArticlePublicListPath(item.type as PressArticleType)}/${item.slug}`,
          image: resolvePressArticleListImageWithVersion(
            item.type as PressArticleType,
            item.image,
            item.updatedAt,
            pressDefaultCovers
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
                logo: appendAssetVersion(
                  toExternalImageProxyUrl(item.mediaOutlet.logo, {
                    publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
                  }) ?? item.mediaOutlet.logo,
                  item.mediaOutlet.updatedAt
                ),
                website: item.mediaOutlet.website,
              }
            : null,
        }
      })

      return {
        data: {
          carousel,
          featuredLinks: featuredLinksList,
          featuredPress: {
            items: featuredPressItems,
          },
        },
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.home.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throwSafePublicError(event, 'public.home.unexpected-error', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'public-home'),
  }
)
