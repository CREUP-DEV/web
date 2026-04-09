import { defineEventHandler, createError, setHeader } from 'h3'
import { eq, and, lte, sql } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles } from '../../db/schema'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../../utils/externalAssetProxy'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { isDatabaseUnavailableError } from '../../utils/databaseErrors'
import { getPublicApiErrorMessage } from '../../utils/apiErrorMessages'
import { logError } from '../../utils/logger'
import { resolvePressTranslation } from '../../utils/pressTranslation'
import { getRequestLocaleContext } from '../../utils/requestLocale'
import { slugRouteParamSchema, validateRouteParams } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
  const { slug } = validateRouteParams(event, slugRouteParamSchema)

  try {
    const article = await db.query.pressArticles.findFirst({
      where: and(
        eq(pressArticles.slug, slug),
        eq(pressArticles.active, true),
        lte(pressArticles.publishedAt, sql`CURRENT_DATE`)
      ),
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

    return {
      article: {
        id: article.id,
        type: article.type,
        slug: article.slug,
        image: article.image
          ? (toExternalImageProxyUrl(article.image, {
              publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
            }) ?? article.image)
          : null,
        pdfUrl:
          toExternalPdfProxyUrl(article.pdfUrl, {
            publicPathBase: '/prensa/documentos',
          }) ?? article.pdfUrl,
        externalUrl: article.externalUrl,
        title: trans?.title ?? '',
        description: trans?.description ?? '',
        alt: trans?.alt ?? '',
        contentHtml: trans?.contentHtml ?? null,
        publishedAt: dateValueToDateOnly(article.publishedAt),
        tags: articleTags,
        mediaOutlet: article.mediaOutlet
          ? {
              name: article.mediaOutlet.name,
              logo:
                toExternalImageProxyUrl(article.mediaOutlet.logo, {
                  publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
                }) ?? article.mediaOutlet.logo,
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

    throw error
  }
})
