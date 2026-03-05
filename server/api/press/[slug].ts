import { defineEventHandler, createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'

/**
 * Public press article detail API — resolves by slug
 */
export default defineEventHandler(async (event) => {
  const locale: string = event.context.requestLocale || 'es'
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

  const trans =
    article.translations.find((t) => t.locale === locale) ||
    article.translations.find((t) => t.locale === 'es') ||
    article.translations[0]

  const articleTags = article.tags.map((pt) => {
    const tagTrans =
      pt.tag.translations.find((t) => t.locale === locale) ||
      pt.tag.translations.find((t) => t.locale === 'es') ||
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
      image: article.image,
      pdfUrl: article.pdfUrl,
      externalUrl: article.externalUrl,
      title: trans?.title ?? '',
      description: trans?.description ?? '',
      alt: trans?.alt ?? '',
      publishedAt: article.publishedAt.toISOString(),
      tags: articleTags,
      mediaOutlet: article.mediaOutlet
        ? {
            name: article.mediaOutlet.name,
            logo: article.mediaOutlet.logo,
            website: article.mediaOutlet.website,
          }
        : null,
    },
  }
})
