import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/adminAssetPublication'
import { sanitizePressTranslations } from '../../../utils/pressTranslation'
import { throwMethodNotAllowed } from '../../../utils/throwMethodNotAllowed'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

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
      data: {
        ...item,
        publishedAt: dateValueToDateOnly(item.publishedAt),
        translations: sanitizePressTranslations(item.translations),
      },
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

    return { data: { success: true } }
  }

  throwMethodNotAllowed()
})
