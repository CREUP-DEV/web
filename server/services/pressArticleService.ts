import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm'
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
import { throwAdminMutationError } from '../utils/admin/adminErrors'
import { throwPossibleDuplicate } from '../utils/admin/possibleDuplicate'
import { getRequiredTranslationValue } from '../utils/locale/localizedContent'
import { getAdminApiErrorMessage } from '../utils/locale/adminApiErrorMessages'
import {
  hasMeaningfulRichTextHtml,
  sanitizePressTranslations,
  sanitizeRichTextHtml,
} from '../utils/press/pressTranslation'
import { assertOptimisticLock, buildExpectedVersionCondition } from '../utils/admin/optimisticLock'
import {
  buildPressBaseSlug,
  buildSlugFamilyPattern,
  generatePressSlug,
  recordPressSlugChange,
} from '../utils/core/slug'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import {
  DEFAULT_LOCALE_CODE,
  SUPPORTED_LOCALE_CODES,
  type SupportedLocaleCode,
} from '~~/shared/utils/locale'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { z } from 'zod'
import type { createPressArticleSchema, updatePressArticleSchema } from '../utils/validation'

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

/**
 * Refuse a create whose title and month match an existing article — its slug would come out as
 * `<base>-N` — unless the editor confirmed it. Must run after `generatePressSlug` in the same
 * transaction: the base slug's advisory lock is what makes the check race-free.
 */
async function assertNoPressArticleDuplicate(tx: PressServiceTx, baseSlug: string, event: H3Event) {
  const [duplicate] = await tx
    .select({
      id: pressArticles.id,
      slug: pressArticles.slug,
      type: pressArticles.type,
      publishedAt: pressArticles.publishedAt,
      title: pressArticleTranslations.title,
    })
    .from(pressArticles)
    .leftJoin(
      pressArticleTranslations,
      and(
        eq(pressArticleTranslations.pressArticleId, pressArticles.id),
        eq(pressArticleTranslations.locale, DEFAULT_LOCALE_CODE)
      )
    )
    .where(sql`${pressArticles.slug} ~ ${buildSlugFamilyPattern(baseSlug)}`)
    .orderBy(desc(pressArticles.createdAt))
    .limit(1)

  if (duplicate) {
    throwPossibleDuplicate(event, {
      id: duplicate.id,
      title: duplicate.title ?? duplicate.slug,
      type: duplicate.type,
      publishedAt: dateValueToDateOnly(duplicate.publishedAt),
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

  try {
    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const publishedAt = data.publishedAt ?? dateValueToDateOnly(new Date())
    const publishedAtDate = dateOnlyToStorageDate(publishedAt)

    const completeItem = await db.transaction(async (tx) => {
      const slug = await generatePressSlug(defaultTitle, publishedAtDate, { executor: tx })

      // Before any asset moves: a refused create leaves the uploads where the resend expects them.
      if (!data.confirmDuplicate) {
        await assertNoPressArticleDuplicate(
          tx,
          buildPressBaseSlug(defaultTitle, publishedAtDate),
          event
        )
      }

      if (data.image) {
        image = await finalizeAdminImage({
          storagePath: data.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: PRESS_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'prensa',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: data.image,
          storagePath: image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      pdfUrl = data.pdfUrl
        ? await finalizeAdminDocument({
            storagePath: data.pdfUrl,
            uploadDir: PDF_UPLOAD_DIR,
            publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
            slug,
            publish: data.active,
            fallbackBaseName: 'documento-prensa',
          })
        : null
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: data.pdfUrl,
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

    const item = await db.transaction(async (tx) => {
      const slug = await generatePressSlug(defaultTitle, publishedAtDate, {
        excludeId: id,
        executor: tx,
      })

      if (data.image) {
        image = await finalizeAdminImage({
          storagePath: data.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: PRESS_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'prensa',
          replaceStoragePath: existingItem.image ?? undefined,
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: data.image,
          storagePath: image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      pdfUrl = data.pdfUrl
        ? await finalizeAdminDocument({
            storagePath: data.pdfUrl,
            uploadDir: PDF_UPLOAD_DIR,
            publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
            slug,
            publish: data.active,
            fallbackBaseName: 'documento-prensa',
            replaceStoragePath: existingItem.pdfUrl,
          })
        : null
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: data.pdfUrl,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
      })

      const optimisticLockCondition = buildExpectedVersionCondition(
        pressArticles.updatedAt,
        data.updatedAt,
        existingItem.updatedAt
      )

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

      // The optimistic lock above guarantees the row still carried `existingItem.slug`.
      await recordPressSlugChange(tx, id, existingItem.slug, slug)

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
