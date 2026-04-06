import { defineEventHandler, readBody, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
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
  adminPressListQuerySchema,
  createPressArticleSchema,
  validateBody,
  validateQuery,
} from '../../../utils/validation'
import { generatePressSlug } from '../../../utils/slug'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

const IMAGE_UPLOAD_DIR = 'public/prensa/imagenes'
const PDF_UPLOAD_DIR = 'public/prensa/documentos'

// GET - List all press articles (optionally filtered by type)
// POST - Create new press article
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const { type } = validateQuery(event, adminPressListQuerySchema)

    const whereClause = type ? eq(pressArticles.type, type) : undefined

    const items = await db.query.pressArticles.findMany({
      where: whereClause,
      orderBy: desc(pressArticles.publishedAt),
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
    return {
      items: items.map((item) => ({
        ...item,
        publishedAt: dateValueToDateOnly(item.publishedAt),
        translations: sanitizePressTranslations(item.translations),
      })),
    }
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    let image: string | null = null
    let pdfUrl: string | null = null
    let finalized = false
    let originalImageStoragePath: string | null = null
    let originalPdfStoragePath: string | null = null

    try {
      const validated = validateBody(createPressArticleSchema, body)
      originalImageStoragePath = validated.image
      originalPdfStoragePath = validated.pdfUrl ?? null

      const defaultTitle = getRequiredTranslationValue(validated.translations, 'title')
      if (!defaultTitle) {
        throw new Error('El título en español es obligatorio')
      }

      const publishedAt = dateOnlyToStorageDate(
        validated.publishedAt ?? dateValueToDateOnly(new Date())
      )

      const completeItem = await db.transaction(async (tx) => {
        const slug = await generatePressSlug(defaultTitle, publishedAt, { executor: tx })
        image = await finalizeAdminImage({
          storagePath: validated.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: PRESS_IMAGE_PUBLIC_BASE,
          slug,
          publish: validated.active,
          fallbackBaseName: 'prensa',
        })
        pdfUrl = validated.pdfUrl
          ? await finalizeAdminDocument({
              storagePath: validated.pdfUrl,
              uploadDir: PDF_UPLOAD_DIR,
              publicPath: PRESS_DOCUMENT_PUBLIC_PATH,
              slug,
              publish: validated.active,
              fallbackBaseName: 'documento-prensa',
            })
          : null

        const [item] = await tx
          .insert(pressArticles)
          .values({
            type: validated.type,
            slug,
            image: image!,
            pdfUrl,
            externalUrl: validated.externalUrl || null,
            mediaOutletId: validated.mediaOutletId || null,
            active: validated.active,
            publishedAt,
          })
          .returning()

        if (!item) {
          throw createError({ statusCode: 500, statusMessage: 'Error al crear el artículo' })
        }

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
              pressArticleId: item.id,
            }))
          )
        }

        if (validated.tagIds && validated.tagIds.length > 0) {
          await tx.insert(pressArticleTags).values(
            validated.tagIds.map((tagId) => ({
              pressArticleId: item.id,
              tagId,
            }))
          )
        }

        return tx.query.pressArticles.findFirst({
          where: eq(pressArticles.id, item.id),
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

      if (validated.image !== image) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      if (validated.pdfUrl && validated.pdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        })
      }

      return {
        item: completeItem
          ? {
              ...completeItem,
              publishedAt: dateValueToDateOnly(completeItem.publishedAt),
              translations: sanitizePressTranslations(completeItem.translations),
            }
          : null,
      }
    } catch (error) {
      if (!finalized && image && image !== originalImageStoragePath) {
        await cleanupUnusedAdminAsset({
          storagePath: image,
          allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
        })
      }

      if (!finalized && pdfUrl && pdfUrl !== originalPdfStoragePath) {
        await cleanupUnusedAdminAsset({
          storagePath: pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        })
      }

      throwAdminMutationError('admin.press.create', error, event)
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
