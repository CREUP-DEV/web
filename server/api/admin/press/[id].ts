import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles, pressArticleTranslations, pressArticleTags } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { getRequiredTranslationValue } from '../../../utils/localizedContent'
import {
  hasMeaningfulRichTextHtml,
  sanitizePressTranslations,
  sanitizeRichTextHtml,
} from '../../../utils/pressTranslation'
import {
  idRouteParamSchema,
  updatePressArticleSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { generatePressSlug } from '../../../utils/slug'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

const IMAGE_UPLOAD_DIR = 'public/prensa/imagenes'
const PDF_UPLOAD_DIR = 'public/prensa/documentos'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  // GET - Get single press article
  if (event.method === 'GET') {
    const item = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.id, id),
      with: {
        translations: true,
        tags: {
          with: {
            tag: { with: { translations: true } },
          },
        },
        mediaOutlet: true,
      },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return {
      item: {
        ...item,
        publishedAt: dateValueToDateOnly(item.publishedAt),
        translations: sanitizePressTranslations(item.translations),
      },
    }
  }

  // PUT - Update press article
  if (event.method === 'PUT') {
    const body = await readBody(event)
    let previousImage: string | null = null
    let previousPdfUrl: string | null = null
    let image: string | null = null
    let pdfUrl: string | null = null
    let finalized = false

    try {
      const existingItem = await db.query.pressArticles.findFirst({
        where: eq(pressArticles.id, id),
      })

      if (!existingItem) {
        throw createError({ statusCode: 404, message: 'No encontrado' })
      }

      const validated = validateBody(updatePressArticleSchema, body)

      const defaultTitle = getRequiredTranslationValue(validated.translations, 'title')
      if (!defaultTitle) {
        throw new Error('El título en español es obligatorio')
      }

      const publishedAt = validated.publishedAt
        ? dateOnlyToStorageDate(validated.publishedAt)
        : existingItem.publishedAt
      previousImage = existingItem.image
      previousPdfUrl = existingItem.pdfUrl

      const item = await db.transaction(async (tx) => {
        const slug = await generatePressSlug(defaultTitle, publishedAt, {
          excludeId: id,
          executor: tx,
        })
        image = await finalizeAdminImage({
          storagePath: validated.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: PRESS_IMAGE_PUBLIC_BASE,
          slug,
          publish: validated.active,
          fallbackBaseName: 'prensa',
          replaceStoragePath: existingItem.image,
        })
        pdfUrl = validated.pdfUrl
          ? await finalizeAdminDocument({
              storagePath: validated.pdfUrl,
              uploadDir: PDF_UPLOAD_DIR,
              publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
              slug,
              publish: validated.active,
              fallbackBaseName: 'documento-prensa',
              replaceStoragePath: existingItem.pdfUrl,
            })
          : null

        await tx
          .delete(pressArticleTranslations)
          .where(eq(pressArticleTranslations.pressArticleId, id))
        await tx.delete(pressArticleTags).where(eq(pressArticleTags.pressArticleId, id))

        await tx
          .update(pressArticles)
          .set({
            type: validated.type,
            slug,
            image: image!,
            pdfUrl,
            externalUrl: validated.externalUrl || null,
            mediaOutletId: validated.mediaOutletId || null,
            active: validated.active,
            publishedAt,
          })
          .where(eq(pressArticles.id, id))

        if (validated.translations.length > 0) {
          await tx.insert(pressArticleTranslations).values(
            validated.translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title.trim(),
              description: translation.description?.trim() || null,
              contentHtml:
                validated.type === 'media_appearance'
                  ? null
                  : hasMeaningfulRichTextHtml(translation.contentHtml)
                    ? sanitizeRichTextHtml(translation.contentHtml)
                    : null,
              alt: translation.alt?.trim() || null,
              pressArticleId: id,
            }))
          )
        }

        if (validated.tagIds && validated.tagIds.length > 0) {
          await tx.insert(pressArticleTags).values(
            validated.tagIds.map((tagId) => ({
              pressArticleId: id,
              tagId,
            }))
          )
        }

        return tx.query.pressArticles.findFirst({
          where: eq(pressArticles.id, id),
          with: {
            translations: true,
            tags: {
              with: {
                tag: { with: { translations: true } },
              },
            },
            mediaOutlet: true,
          },
        })
      })
      finalized = true

      if (previousImage !== image) {
        await cleanupUnusedAdminAsset({
          storagePath: previousImage,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      if (previousPdfUrl && previousPdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: previousPdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        })
      }

      return {
        item: item
          ? {
              ...item,
              publishedAt: dateValueToDateOnly(item.publishedAt),
              translations: sanitizePressTranslations(item.translations),
            }
          : null,
      }
    } catch (error) {
      if (!finalized && image && image !== previousImage) {
        await cleanupUnusedAdminAsset({
          storagePath: image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      if (!finalized && pdfUrl && pdfUrl !== previousPdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        })
      }

      throwAdminMutationError('admin.press.update', error, event)
    }
  }

  // DELETE - Delete press article
  if (event.method === 'DELETE') {
    const existingItem = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    await db.delete(pressArticles).where(eq(pressArticles.id, id))

    await cleanupUnusedAdminAsset({
      storagePath: existingItem.image,
      allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
    })

    if (existingItem.pdfUrl) {
      await cleanupUnusedAdminAsset({
        storagePath: existingItem.pdfUrl,
        allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
      })
    }

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
