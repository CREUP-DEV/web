import type { H3Event } from 'h3'
import { and, eq, lte, sql, type SQL } from 'drizzle-orm'
import { db } from '../../db'
import { pressArticles, pressArticleSlugHistory } from '../../db/schema'
import { getBaseLanguage, pickLocalizedEntry } from '~~/shared/utils/locale'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { isPressArticlePublic } from '~~/shared/utils/publicVisibility'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../external/externalAssetUrl'
import {
  getPressDefaultCoverEntriesRow,
  resolvePressArticleListImageWithVersion,
} from '../admin/siteDefaultImages'
import { appendAssetVersion } from '../core/assetVersion'
import { getRequestLocaleContext } from '../locale/requestLocale'
import { resolvePressTranslation } from './pressTranslation'

/**
 * The press detail payload, single-sourced for the public page (`/api/press/[slug]`) and the admin
 * preview (`/api/admin/press/[id]/preview`) so the preview cannot drift from what gets published.
 * Only the lookup differs: the public one is gated and follows former slugs, the preview is by id.
 */

function findPressArticleForDetail(where: SQL | undefined) {
  return db.query.pressArticles.findFirst({
    where,
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
  })
}

type PressArticleDetailRow = NonNullable<Awaited<ReturnType<typeof findPressArticleForDetail>>>

/** The public gate, mirrored client-side by `isPressArticlePublic`. */
function isPublicPressArticle() {
  return and(eq(pressArticles.active, true), lte(pressArticles.publishedAt, sql`CURRENT_DATE`))
}

/**
 * The public article a slug leads to: the one carrying it now, or else the one that carried it
 * before (its detail page then redirects to the current slug). Either way only if it is public.
 */
export async function findPublicPressArticleBySlug(slug: string) {
  const current = await findPressArticleForDetail(
    and(eq(pressArticles.slug, slug), isPublicPressArticle())
  )
  if (current) {
    return current
  }

  const [former] = await db
    .select({ pressArticleId: pressArticleSlugHistory.pressArticleId })
    .from(pressArticleSlugHistory)
    .where(eq(pressArticleSlugHistory.slug, slug))
    .limit(1)

  if (!former) {
    return undefined
  }

  return findPressArticleForDetail(
    and(eq(pressArticles.id, former.pressArticleId), isPublicPressArticle())
  )
}

/** Any article by id, whatever its status — the admin preview. */
export function findPressArticleForPreview(id: string) {
  return findPressArticleForDetail(eq(pressArticles.id, id))
}

/** Loads the per-type default covers the payload falls back to; run it alongside the lookup. */
export function loadPressArticleDetailDefaults() {
  return getPressDefaultCoverEntriesRow()
}

export function buildPressArticleDetailPayload(
  event: H3Event,
  article: PressArticleDetailRow,
  defaultCovers: Awaited<ReturnType<typeof loadPressArticleDetailDefaults>>
) {
  const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
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
  }
}

/** What the preview banner needs to say why the article is not public (yet). */
export function buildPressArticlePreviewStatus(article: PressArticleDetailRow) {
  const publishedAt = dateValueToDateOnly(article.publishedAt)
  return {
    active: article.active,
    publishedAt,
    isPublic: isPressArticlePublic({ active: article.active, publishedAt }),
  }
}
