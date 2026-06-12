import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, pressArticleTranslations, pressArticleTags, tags } from '../db/schema'
import { finalizeAdminDocument } from '../utils/admin/adminDocumentUpload'
import { finalizeAdminImage } from '../utils/admin/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../utils/admin/adminAssetPublication'
import { isUniqueConstraintViolation, throwAdminMutationError } from '../utils/admin/adminErrors'
import { getRequiredTranslationValue } from '../utils/locale/localizedContent'
import { getAdminApiErrorMessage } from '../utils/locale/adminApiErrorMessages'
import {
  hasMeaningfulRichTextHtml,
  sanitizePressTranslations,
  sanitizeRichTextHtml,
} from '../utils/press/pressTranslation'
import { assertOptimisticLock, buildOptimisticLockCondition } from '../utils/admin/optimisticLock'
import { generatePressSlug } from '../utils/core/slug'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { SUPPORTED_LOCALE_CODES, type SupportedLocaleCode } from '~~/shared/utils/locale'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { z } from 'zod'
import type { createPressArticleSchema, updatePressArticleSchema } from '../utils/validation'

function randomSlugSuffix(): string {
  return Math.random().toString(16).slice(2, 6)
}

function isSlugUniqueConstraintViolation(error: unknown): boolean {
  if (!isUniqueConstraintViolation(error)) return false
  const e = error as { constraint?: string; detail?: string }
  // If constraint name or detail mention slug, it's a slug collision.
  // Fall back to accepting any unique violation if constraint info is absent.
  if (e.constraint) return e.constraint.toLowerCase().includes('slug')
  if (e.detail) return e.detail.toLowerCase().includes('slug')
  return true
}

const IMAGE_UPLOAD_DIR = 'public/prensa/imagenes'
const PDF_UPLOAD_DIR = 'public/prensa/documentos'

type PressServiceTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// A stale admin tab can submit tagIds that were deleted in the meantime. Without this
// the FK insert raises 23503 → generic 500 + full rollback; pre-validate for a clean 409.
async function assertTagsExist(tx: PressServiceTx, tagIds: string[], event: H3Event) {
  if (tagIds.length === 0) return
  const distinctIds = [...new Set(tagIds)]
  const existing = await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, distinctIds))
  if (existing.length !== distinctIds.length) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'pressArticleTagsMissing'),
    })
  }
}

type PressArticleData = z.infer<typeof createPressArticleSchema>
type UpdatePressArticleData = z.infer<typeof updatePressArticleSchema>
type PressArticleTranslationRow = {
  locale: SupportedLocaleCode
  title: string
  description: string | null
  contentHtml: string | null
  alt: string | null
}
type PressArticleQueryItem = NonNullable<
  Awaited<ReturnType<typeof db.query.pressArticles.findFirst>>
> & {
  translations: PressArticleTranslationRow[]
}

const WITH_FULL_RELATIONS = {
  translations: true,
  tags: { with: { tag: { with: { translations: true } } } },
  mediaOutlet: true,
} as const

function buildTranslationValues(
  translations: PressArticleData['translations'],
  type: string,
  pressArticleId: string
) {
  return translations.map((translation) => ({
    locale: translation.locale,
    title: translation.title.trim(),
    description: translation.description?.trim() || null,
    contentHtml:
      type === 'media_appearance'
        ? null
        : hasMeaningfulRichTextHtml(translation.contentHtml)
          ? sanitizeRichTextHtml(translation.contentHtml)
          : null,
    alt: translation.alt?.trim() || null,
    pressArticleId,
  }))
}

function formatItem(item: PressArticleQueryItem | null) {
  if (!item) return null
  return {
    ...item,
    publishedAt: dateValueToDateOnly(item.publishedAt),
    translations: sanitizePressTranslations(item.translations).filter(
      (t): t is typeof t & { locale: SupportedLocaleCode } =>
        (SUPPORTED_LOCALE_CODES as readonly string[]).includes(t.locale)
    ),
  }
}

export async function createPressArticle(data: PressArticleData, event: H3Event) {
  let image: string | null = null
  let pdfUrl: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  // Runs one create transaction. imageSource/pdfSource allow a retry to pass
  // the already-moved file paths from a failed first attempt.
  async function runTransaction(
    defaultTitle: string,
    publishedAt: string,
    publishedAtDate: Date,
    opts: { forcedSlugSuffix?: string; imageSource?: string | null; pdfSource?: string | null }
  ) {
    return db.transaction(async (tx) => {
      const slug = await generatePressSlug(defaultTitle, publishedAtDate, {
        executor: tx,
        forcedSuffix: opts.forcedSlugSuffix,
      })

      const effectiveImageSource = opts.imageSource !== undefined ? opts.imageSource : data.image
      const effectivePdfSource = opts.pdfSource !== undefined ? opts.pdfSource : data.pdfUrl

      if (effectiveImageSource) {
        image = await finalizeAdminImage({
          storagePath: effectiveImageSource,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: PRESS_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'prensa',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: effectiveImageSource,
          storagePath: image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      pdfUrl = effectivePdfSource
        ? await finalizeAdminDocument({
            storagePath: effectivePdfSource,
            uploadDir: PDF_UPLOAD_DIR,
            publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
            slug,
            publish: data.active,
            fallbackBaseName: 'documento-prensa',
          })
        : null
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: effectivePdfSource,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
      })

      const [item] = await tx
        .insert(pressArticles)
        .values({
          type: data.type,
          slug,
          image: image ?? null,
          pdfUrl,
          externalUrl: data.externalUrl || null,
          mediaOutletId: data.mediaOutletId || null,
          active: data.active,
          publishedAt,
        })
        .returning()

      if (!item)
        throw createError({
          statusCode: 500,
          message: getAdminApiErrorMessage(event, 'pressArticleCreateFailed'),
        })

      if (data.translations.length > 0) {
        await tx
          .insert(pressArticleTranslations)
          .values(buildTranslationValues(data.translations, data.type, item.id))
      }

      await assertTagsExist(tx, data.tagIds, event)
      if (data.tagIds.length > 0) {
        await tx
          .insert(pressArticleTags)
          .values(data.tagIds.map((tagId) => ({ pressArticleId: item.id, tagId })))
      }

      return (await tx.query.pressArticles.findFirst({
        where: eq(pressArticles.id, item.id),
        with: WITH_FULL_RELATIONS,
      })) as PressArticleQueryItem | null
    })
  }

  try {
    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const publishedAt = data.publishedAt ?? dateValueToDateOnly(new Date())
    const publishedAtDate = dateOnlyToStorageDate(publishedAt)

    let completeItem: PressArticleQueryItem | null

    try {
      completeItem = await runTransaction(defaultTitle, publishedAt, publishedAtDate, {})
    } catch (firstError) {
      if (!isSlugUniqueConstraintViolation(firstError)) throw firstError

      // Slug collision on insert — retry once with a random suffix on the slug.
      // Capture the paths where assets were moved in the failed attempt so the
      // retry can rename them to match the new slug instead of re-reading the
      // (now-gone) temp source.
      const firstImage = image
      const firstPdfUrl = pdfUrl
      image = null
      pdfUrl = null
      // Clear tracking so rollback cleanup doesn't double-delete on retry failure.
      cleanupTargets.splice(0)

      completeItem = await runTransaction(defaultTitle, publishedAt, publishedAtDate, {
        forcedSlugSuffix: randomSlugSuffix(),
        // Only override source if the first attempt actually moved the file;
        // otherwise fall back to the original data path (file still in place).
        imageSource: firstImage ?? undefined,
        pdfSource: firstPdfUrl ?? undefined,
      }).catch(() => {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'pressArticleSlugFailed'),
        })
      })
    }

    if (data.image && data.image !== image) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: data.image, allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE] },
        'admin.press.create.cleanup.image',
        event
      )
    }
    if (data.pdfUrl && data.pdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: data.pdfUrl, allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH] },
        'admin.press.create.cleanup.pdf',
        event
      )
    }

    return formatItem(completeItem ?? null)
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.press.create.rollback', event)
    throwAdminMutationError('admin.press.create', error, event)
  }
}

export async function updatePressArticle(id: string, data: UpdatePressArticleData, event: H3Event) {
  let previousImage: string | null = null
  let previousPdfUrl: string | null = null
  let image: string | null = null
  let pdfUrl: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  // Runs one update transaction. imageSource/pdfSource allow a retry to pass
  // the already-moved file paths from a failed first attempt.
  async function runTransaction(
    existingItem: NonNullable<Awaited<ReturnType<typeof db.query.pressArticles.findFirst>>>,
    publishedAt: string,
    publishedAtDate: Date,
    defaultTitle: string,
    opts: { forcedSlugSuffix?: string; imageSource?: string | null; pdfSource?: string | null }
  ) {
    return db.transaction(async (tx) => {
      const slug = await generatePressSlug(defaultTitle, publishedAtDate, {
        excludeId: id,
        executor: tx,
        forcedSuffix: opts.forcedSlugSuffix,
      })

      const effectiveImageSource = opts.imageSource !== undefined ? opts.imageSource : data.image
      const effectivePdfSource = opts.pdfSource !== undefined ? opts.pdfSource : data.pdfUrl

      if (effectiveImageSource) {
        image = await finalizeAdminImage({
          storagePath: effectiveImageSource,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: PRESS_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'prensa',
          replaceStoragePath: existingItem.image ?? undefined,
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: effectiveImageSource,
          storagePath: image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      pdfUrl = effectivePdfSource
        ? await finalizeAdminDocument({
            storagePath: effectivePdfSource,
            uploadDir: PDF_UPLOAD_DIR,
            publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
            slug,
            publish: data.active,
            fallbackBaseName: 'documento-prensa',
            replaceStoragePath: existingItem.pdfUrl,
          })
        : null
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: effectivePdfSource,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
      })

      const optimisticLockCondition = data.updatedAt
        ? buildOptimisticLockCondition(pressArticles.updatedAt, data.updatedAt)
        : existingItem.updatedAt
          ? eq(pressArticles.updatedAt, existingItem.updatedAt)
          : isNull(pressArticles.updatedAt)

      const updatedRows = await tx
        .update(pressArticles)
        .set({
          type: data.type,
          slug,
          image: image ?? null,
          pdfUrl,
          externalUrl: data.externalUrl || null,
          mediaOutletId: data.mediaOutletId || null,
          active: data.active,
          publishedAt,
        })
        .where(and(eq(pressArticles.id, id), optimisticLockCondition))
        .returning({ id: pressArticles.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'pressArticleOptimisticLock'),
        })
      }

      // Translations: upsert changed locales, delete removed ones
      const newLocales = data.translations.map((t) => t.locale)
      if (newLocales.length > 0) {
        await tx
          .delete(pressArticleTranslations)
          .where(
            and(
              eq(pressArticleTranslations.pressArticleId, id),
              notInArray(pressArticleTranslations.locale, newLocales)
            )
          )

        await tx
          .insert(pressArticleTranslations)
          .values(buildTranslationValues(data.translations, data.type, id))
          .onConflictDoUpdate({
            target: [pressArticleTranslations.locale, pressArticleTranslations.pressArticleId],
            set: {
              title: sql`excluded.title`,
              description: sql`excluded.description`,
              contentHtml: sql`excluded.content_html`,
              alt: sql`excluded.alt`,
            },
          })
      } else {
        await tx
          .delete(pressArticleTranslations)
          .where(eq(pressArticleTranslations.pressArticleId, id))
      }

      // Tags: insert new, remove dropped, ignore unchanged
      const newTagIds = data.tagIds ?? []
      await assertTagsExist(tx, newTagIds, event)
      if (newTagIds.length > 0) {
        await tx
          .delete(pressArticleTags)
          .where(
            and(
              eq(pressArticleTags.pressArticleId, id),
              notInArray(pressArticleTags.tagId, newTagIds)
            )
          )
        await tx
          .insert(pressArticleTags)
          .values(newTagIds.map((tagId) => ({ pressArticleId: id, tagId })))
          .onConflictDoNothing()
      } else {
        await tx.delete(pressArticleTags).where(eq(pressArticleTags.pressArticleId, id))
      }

      return (await tx.query.pressArticles.findFirst({
        where: eq(pressArticles.id, id),
        with: WITH_FULL_RELATIONS,
      })) as PressArticleQueryItem | null
    })
  }

  try {
    const existingItem = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.id, id),
    })

    if (!existingItem)
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })

    assertOptimisticLock(
      data.updatedAt,
      existingItem.updatedAt,
      getAdminApiErrorMessage(event, 'pressArticleOptimisticLock')
    )

    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const publishedAt = data.publishedAt ?? existingItem.publishedAt
    const publishedAtDate = dateOnlyToStorageDate(publishedAt)

    previousImage = existingItem.image
    previousPdfUrl = existingItem.pdfUrl

    let item: PressArticleQueryItem | null

    try {
      item = await runTransaction(existingItem, publishedAt, publishedAtDate, defaultTitle, {})
    } catch (firstError) {
      if (!isSlugUniqueConstraintViolation(firstError)) throw firstError

      // Slug collision on update — retry once with a random suffix on the slug.
      // Capture the paths where assets were moved in the failed attempt so the
      // retry can rename them to match the new slug instead of re-reading the
      // (now-gone) temp source.
      const firstImage = image
      const firstPdfUrl = pdfUrl
      image = null
      pdfUrl = null
      // Clear tracking so rollback cleanup doesn't double-delete on retry failure.
      cleanupTargets.splice(0)

      item = await runTransaction(existingItem, publishedAt, publishedAtDate, defaultTitle, {
        forcedSlugSuffix: randomSlugSuffix(),
        // Only override source if the first attempt actually moved the file;
        // otherwise fall back to the original data path (file still in place).
        imageSource: firstImage ?? undefined,
        pdfSource: firstPdfUrl ?? undefined,
      }).catch(() => {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'pressArticleSlugFailed'),
        })
      })
    }

    if (previousImage !== image) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: previousImage, allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE] },
        'admin.press.update.cleanup.image',
        event
      )
    }
    if (previousPdfUrl && previousPdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: previousPdfUrl, allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH] },
        'admin.press.update.cleanup.pdf',
        event
      )
    }

    return formatItem(item ?? null)
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.press.update.rollback', event)
    throwAdminMutationError('admin.press.update', error, event)
  }
}
