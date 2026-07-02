import { and, asc, desc, eq, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { activityEntries, carouselItems, featuredLinks, pressArticles } from '../db/schema'
import { appendAssetVersion } from '../utils/core/assetVersion'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { resolveActivityTranslationSummary } from '../utils/activity/activityTranslation'
import {
  ACTIVITY_IMAGE_PUBLIC_BASE,
  HOME_IMAGE_PUBLIC_BASE,
  PRESS_DOCUMENT_PUBLIC_PATH,
  PRESS_IMAGE_PUBLIC_BASE,
} from '~~/shared/constants/assetPaths'
import { ACTIVITY_PUBLIC_BASE_PATH } from '~~/shared/constants/activity'
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
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { pickLocalizedEntry, pickLocalizedEntryWithFieldFallback } from '~~/shared/utils/locale'

const HOME_FEATURED_PRESS_LIMIT = 4
const HOME_RECENT_ACTIVITY_LIMIT = 4

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
        recentActivityList,
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
        db.query.activityEntries.findMany({
          where: eq(activityEntries.active, true),
          orderBy: [desc(activityEntries.startDate), desc(activityEntries.createdAt)],
          limit: HOME_RECENT_ACTIVITY_LIMIT,
          columns: {
            id: true,
            kind: true,
            slug: true,
            image: true,
            startDate: true,
            endDate: true,
            isOnline: true,
            location: true,
            memberOrgSnapshot: true,
            updatedAt: true,
          },
          with: {
            translations: {
              columns: { locale: true, title: true, excerpt: true, alt: true, imageCaption: true },
            },
          },
        }),
      ])

      const defaultCarouselImage = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.carousel,
        SITE_DEFAULT_IMAGE_SLOT.carouselSlide
      )

      const defaultActivityImage = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.activity,
        SITE_DEFAULT_IMAGE_SLOT.activityEntry
      )

      const carousel = carouselItemsList.map((item) => {
        const translation = pickLocalizedEntryWithFieldFallback(
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
        const translation = pickLocalizedEntryWithFieldFallback(
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
              publicPathBase: PRESS_DOCUMENT_PUBLIC_PATH,
            }) ?? item.pdfUrl,
            item.updatedAt
          ),
          externalUrl: item.externalUrl,
          title: trans?.title ?? '',
          description: trans?.description ?? '',
          alt: trans?.alt ?? '',
          titleLocale: trans?.titleLocale ?? null,
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

      const recentActivityItems = recentActivityList.map((item) => {
        const trans = resolveActivityTranslationSummary(item.translations, locale, fallbackLocale)
        return {
          id: item.id,
          kind: item.kind,
          slug: item.slug,
          path: `${ACTIVITY_PUBLIC_BASE_PATH}/${item.slug}`,
          image: item.image
            ? appendAssetVersion(
                toExternalImageProxyUrl(item.image, {
                  publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE,
                }) ?? item.image,
                item.updatedAt
              )
            : defaultActivityImage,
          startDate: item.startDate,
          endDate: item.endDate,
          isOnline: item.isOnline,
          location: item.location,
          title: trans.title,
          excerpt: trans.excerpt,
          alt: trans.alt,
          titleLocale: trans.titleLocale,
          excerptLocale: trans.excerptLocale,
          memberOrg:
            item.kind === 'member' && item.memberOrgSnapshot
              ? {
                  denomination: item.memberOrgSnapshot.denomination,
                  initials: item.memberOrgSnapshot.initials,
                  logoLight: item.memberOrgSnapshot.logoLight,
                  logoDark: item.memberOrgSnapshot.logoDark,
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
          recentActivity: {
            items: recentActivityItems,
          },
        },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.home', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'public-home'),
  }
)
