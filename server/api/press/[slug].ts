import { defineEventHandler, createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'
import {
  normalizeLocaleDefinitions,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '~~/shared/utils/locale'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../../utils/externalAssetProxy'
import { resolvePressTranslation } from '../../utils/pressTranslation'

/**
 * Public press article detail API — resolves by slug
 */
export default defineEventHandler(async (event) => {
  const runtimeI18n = useRuntimeConfig(event).public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const locale = resolveLocaleCode(event.context.requestLocale, locales, defaultLocale)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug requerido' })
  }

  const article = await db.query.pressArticles.findFirst({
    where: and(eq(pressArticles.slug, slug), eq(pressArticles.active, true)),
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

  if (!article) {
    throw createError({ statusCode: 404, message: 'Artículo no encontrado' })
  }

  const trans = resolvePressTranslation(article.translations, locale, defaultLocale)

  const articleTags = article.tags.map((pt) => {
    const tagTrans =
      pt.tag.translations.find(
        (translation) =>
          resolveLocaleCode(translation.locale, locales, '') ===
          resolveLocaleCode(locale, locales, defaultLocale)
      ) ??
      pt.tag.translations.find(
        (translation) => resolveLocaleCode(translation.locale, locales, '') === defaultLocale
      ) ??
      pt.tag.translations[0]
    return {
      slug: pt.tag.slug,
      name: tagTrans?.name ?? pt.tag.slug,
    }
  })

  return {
    article: {
      id: article.id,
      type: article.type,
      slug: article.slug,
      image:
        toExternalImageProxyUrl(article.image, {
          publicPathBase: '/prensa/imagenes',
        }) ?? article.image,
      pdfUrl:
        toExternalPdfProxyUrl(article.pdfUrl, {
          publicPathBase: '/prensa/documentos',
        }) ?? article.pdfUrl,
      externalUrl: article.externalUrl,
      title: trans?.title ?? '',
      description: trans?.description ?? '',
      alt: trans?.alt ?? '',
      contentHtml: trans?.contentHtml ?? null,
      publishedAt: article.publishedAt.toISOString(),
      tags: articleTags,
      mediaOutlet: article.mediaOutlet
        ? {
            name: article.mediaOutlet.name,
            logo:
              toExternalImageProxyUrl(article.mediaOutlet.logo, {
                publicPathBase: '/prensa/imagenes',
              }) ?? article.mediaOutlet.logo,
            website: article.mediaOutlet.website,
          }
        : null,
    },
  }
})
