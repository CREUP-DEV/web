import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/adminAssetPublication'
import { sanitizePressTranslations } from '../../../utils/pressTranslation'
import {
  idRouteParamSchema,
  updatePressArticleSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { updatePressArticle } from '../../../services/pressArticleService'

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
    const validated = validateBody(updatePressArticleSchema, body)
    const item = await updatePressArticle(id, validated, event)
    return { item }
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

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.image,
        allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
      },
      'admin.press.delete.cleanup.image',
      event
    )

    if (existingItem.pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: existingItem.pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        },
        'admin.press.delete.cleanup.pdf',
        event
      )
    }

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
