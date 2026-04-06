import { createError, setHeader } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db'
import { carouselItems, featuredLinks } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { HOME_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)

    try {
      const carouselItemsList = await db.query.carouselItems.findMany({
        where: eq(carouselItems.active, true),
        orderBy: asc(carouselItems.order),
        with: { translations: true },
      })

      const linkItemsList = await db.query.featuredLinks.findMany({
        where: eq(featuredLinks.active, true),
        orderBy: asc(featuredLinks.order),
        with: { translations: true },
      })

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
        return {
          image:
            toExternalImageProxyUrl(item.image, {
              publicPathBase: HOME_IMAGE_PUBLIC_BASE,
            }) ?? item.image,
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
          image:
            toExternalImageProxyUrl(item.image, {
              publicPathBase: HOME_IMAGE_PUBLIC_BASE,
            }) ?? item.image,
          to: item.to,
          title: translation.title,
          alt: (translation as { alt?: string | null }).alt ?? '',
        }
      })

      return {
        carousel,
        featuredLinks: featuredLinksList,
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.home-data.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          statusMessage: 'Servicio temporalmente no disponible',
        })
      }

      throw error
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'public-home-data'),
  }
)
