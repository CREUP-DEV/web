/**
 * Home Data API endpoint
 * Returns data for the home page (carousel, featured links)
 * Press articles are now fetched separately via /api/press
 */

import { defineEventHandler } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db'
import { carouselItems, featuredLinks } from '../db/schema'
import {
  normalizeLocaleDefinitions,
  pickLocalizedEntry,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'

export default defineEventHandler(async (event) => {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const locale = resolveLocaleCode(event.context.requestLocale, locales, defaultLocale)

  // Fetch carousel items
  const carouselItemsList = await db.query.carouselItems.findMany({
    where: eq(carouselItems.active, true),
    orderBy: asc(carouselItems.order),
    with: { translations: true },
  })

  // Fetch featured links
  const linkItemsList = await db.query.featuredLinks.findMany({
    where: eq(featuredLinks.active, true),
    orderBy: asc(featuredLinks.order),
    with: { translations: true },
  })

  // Transform data with locale-specific translations
  const carousel = carouselItemsList.map((item) => {
    const translation = pickLocalizedEntry(item.translations, locale, locales, defaultLocale) || {
      title: '',
      buttonText: '',
      alt: null,
    }
    return {
      image:
        toExternalImageProxyUrl(item.image, {
          publicPathBase: '/inicio/imagenes',
        }) ?? item.image,
      href: item.href,
      title: translation.title,
      buttonText: translation.buttonText,
      alt: (translation as { alt?: string | null }).alt ?? '',
    }
  })

  const featuredLinksList = linkItemsList.map((item) => {
    const translation = pickLocalizedEntry(item.translations, locale, locales, defaultLocale) || {
      title: '',
      alt: null,
    }
    return {
      image:
        toExternalImageProxyUrl(item.image, {
          publicPathBase: '/inicio/imagenes',
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
})
