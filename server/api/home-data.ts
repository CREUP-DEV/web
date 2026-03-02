/**
 * Home Data API endpoint
 * Returns data for the home page (carousel, featured news, featured links)
 * Events are now fetched separately from Google Calendar
 */

import { defineEventHandler } from 'h3'
import { eq, asc, desc } from 'drizzle-orm'
import { db } from '../db'
import { carouselItems, newsItems, featuredLinks } from '../db/schema'

export default defineEventHandler(async (event) => {
  // Get locale from middleware context
  const locale = event.context.requestLocale || 'es'

  // Fetch carousel items
  const carouselItemsList = await db.query.carouselItems.findMany({
    where: eq(carouselItems.active, true),
    orderBy: asc(carouselItems.order),
    with: { translations: true },
  })

  // Fetch featured news (latest 4)
  const newsItemsList = await db.query.newsItems.findMany({
    where: eq(newsItems.active, true),
    orderBy: desc(newsItems.publishedAt),
    limit: 4,
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
    const translation = item.translations.find((t) => t.locale === locale) ||
      item.translations.find((t) => t.locale === 'es') || {
        title: '',
        buttonText: '',
        alt: null,
      }
    return {
      image: item.image,
      href: item.href,
      title: translation.title,
      buttonText: translation.buttonText,
      alt: (translation as { alt?: string | null }).alt ?? '',
    }
  })

  const featuredNews = newsItemsList.map((item) => {
    const translation = item.translations.find((t) => t.locale === locale) ||
      item.translations.find((t) => t.locale === 'es') || {
        title: '',
        alt: null,
      }
    return {
      image: item.image,
      to: item.to,
      title: translation.title,
      alt: (translation as { alt?: string | null }).alt ?? '',
    }
  })

  const featuredLinksList = linkItemsList.map((item) => {
    const translation = item.translations.find((t) => t.locale === locale) ||
      item.translations.find((t) => t.locale === 'es') || {
        title: '',
        alt: null,
      }
    return {
      image: item.image,
      to: item.to,
      title: translation.title,
      alt: (translation as { alt?: string | null }).alt ?? '',
    }
  })

  return {
    carousel,
    featuredNews,
    featuredLinks: featuredLinksList,
  }
})
