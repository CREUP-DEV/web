import { defineEventHandler, getQuery } from 'h3'
import { eq, desc, and, inArray, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, tags, pressArticleTags } from '../db/schema'
import {
  normalizeLocaleDefinitions,
  pickLocalizedEntry,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '../../shared/utils/locale'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'

/**
 * Public press articles API
 * Supports filtering by type and tag, with locale-aware translations
 */
export default defineEventHandler(async (event) => {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const locale = resolveLocaleCode(event.context.requestLocale, locales, defaultLocale)
  const query = getQuery(event)
  const type = query.type as string | undefined
  const tagSlug = query.tag as string | undefined
  const limit = parseInt(query.limit as string) || 12

  // Build where conditions
  const conditions: SQL[] = [eq(pressArticles.active, true)]

  // Filter by type
  if (type) {
    conditions.push(eq(pressArticles.type, type))
  }

  // Filter by tag
  if (tagSlug && tagSlug !== 'all') {
    const tag = await db.query.tags.findFirst({
      where: eq(tags.slug, tagSlug),
    })
    if (tag) {
      const articleIds = (
        await db.query.pressArticleTags.findMany({
          where: eq(pressArticleTags.tagId, tag.id),
        })
      ).map((pt) => pt.pressArticleId)

      if (articleIds.length > 0) {
        conditions.push(inArray(pressArticles.id, articleIds))
      } else {
        return { articles: [] }
      }
    } else {
      return { articles: [] }
    }
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

  const articlesList = await db.query.pressArticles.findMany({
    where: whereClause,
    orderBy: desc(pressArticles.publishedAt),
    limit,
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
  })

  const articles = articlesList.map((item) => {
    const trans = pickLocalizedEntry(item.translations, locale, locales, defaultLocale)
    const articleTags = item.tags.map((pt) => {
      const tagTrans = pickLocalizedEntry(pt.tag.translations, locale, locales, defaultLocale)
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
      publishedAt: item.publishedAt.toISOString(),
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

  return { articles }
})
