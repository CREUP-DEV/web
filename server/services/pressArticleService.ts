import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, eq, notInArray, sql } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, pressArticleTranslations, pressArticleTags } from '../db/schema'
import { finalizeAdminDocument } from '../utils/adminDocumentUpload'
import { finalizeAdminImage } from '../utils/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../utils/adminAssetPublication'
import { throwAdminMutationError } from '../utils/adminErrors'
import { getRequiredTranslationValue } from '../utils/localizedContent'
import {
  hasMeaningfulRichTextHtml,
  sanitizePressTranslations,
  sanitizeRichTextHtml,
} from '../utils/pressTranslation'
import { generatePressSlug } from '../utils/slug'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { z } from 'zod'
import type { createPressArticleSchema } from '../utils/validation'

const IMAGE_UPLOAD_DIR = 'public/prensa/imagenes'
const PDF_UPLOAD_DIR = 'public/prensa/documentos'

type PressArticleData = z.infer<typeof createPressArticleSchema>

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

function formatItem(item: Awaited<ReturnType<typeof db.query.pressArticles.findFirst>>) {
  if (!item) return null
  return {
    ...item,
    publishedAt: dateValueToDateOnly(item.publishedAt),
    translations: sanitizePressTranslations(item.translations),
  }
}

export async function createPressArticle(data: PressArticleData, event: H3Event) {
  let image: string | null = null
  let pdfUrl: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const publishedAt = dateOnlyToStorageDate(data.publishedAt ?? dateValueToDateOnly(new Date()))

    const completeItem = await db.transaction(async (tx) => {
      const slug = await generatePressSlug(defaultTitle, publishedAt, { executor: tx })

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
          image: image!,
          pdfUrl,
          externalUrl: data.externalUrl || null,
          mediaOutletId: data.mediaOutletId || null,
          active: data.active,
          publishedAt,
        })
        .returning()

      if (!item) throw createError({ statusCode: 500, statusMessage: 'Error al crear el artículo' })

      if (data.translations.length > 0) {
        await tx
          .insert(pressArticleTranslations)
          .values(buildTranslationValues(data.translations, data.type, item.id))
      }

      if (data.tagIds.length > 0) {
        await tx
          .insert(pressArticleTags)
          .values(data.tagIds.map((tagId) => ({ pressArticleId: item.id, tagId })))
      }

      return tx.query.pressArticles.findFirst({
        where: eq(pressArticles.id, item.id),
        with: WITH_FULL_RELATIONS,
      })
    })

    if (data.image !== image) {
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

export async function updatePressArticle(id: string, data: PressArticleData, event: H3Event) {
  let previousImage: string | null = null
  let previousPdfUrl: string | null = null
  let image: string | null = null
  let pdfUrl: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.id, id),
    })

    if (!existingItem) throw createError({ statusCode: 404, message: 'No encontrado' })

    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const publishedAt = data.publishedAt
      ? dateOnlyToStorageDate(data.publishedAt)
      : existingItem.publishedAt

    previousImage = existingItem.image
    previousPdfUrl = existingItem.pdfUrl

    const item = await db.transaction(async (tx) => {
      const slug = await generatePressSlug(defaultTitle, publishedAt, {
        excludeId: id,
        executor: tx,
      })

      image = await finalizeAdminImage({
        storagePath: data.image,
        uploadDir: IMAGE_UPLOAD_DIR,
        publicPath: PRESS_IMAGE_PUBLIC_BASE,
        slug,
        publish: data.active,
        fallbackBaseName: 'prensa',
        replaceStoragePath: existingItem.image,
      })
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: data.image,
        storagePath: image,
        allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
      })

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

      await tx
        .update(pressArticles)
        .set({
          type: data.type,
          slug,
          image: image!,
          pdfUrl,
          externalUrl: data.externalUrl || null,
          mediaOutletId: data.mediaOutletId || null,
          active: data.active,
          publishedAt,
        })
        .where(eq(pressArticles.id, id))

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

      return tx.query.pressArticles.findFirst({
        where: eq(pressArticles.id, id),
        with: WITH_FULL_RELATIONS,
      })
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
