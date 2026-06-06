import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressDossier } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/admin/adminDocumentUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/admin/adminAssetPublication'
import { invalidatePressDossierCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { validateBody } from '../../../utils/validation'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { updatePressDossierSchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'

const PDF_UPLOAD_DIR = 'public/prensa'
const PRESS_DOSSIER_FILE_SLUG = 'dossier-prensa'
const PRESS_DOSSIER_PUBLIC_BASE = PRESS_DOSSIER_PUBLIC_PATH.slice(
  0,
  PRESS_DOSSIER_PUBLIC_PATH.lastIndexOf('/')
)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(event, updatePressDossierSchema, body)
    const item = await db.transaction(async (tx) => {
      const existingItem = await tx.query.pressDossier.findFirst()

      if (validated.updatedAt && existingItem) {
        const clientUpdatedAt = new Date(validated.updatedAt).getTime()
        const serverUpdatedAt = existingItem.updatedAt
          ? new Date(existingItem.updatedAt).getTime()
          : 0

        if (clientUpdatedAt !== serverUpdatedAt) {
          throw createError({
            statusCode: 409,
            message: getAdminApiErrorMessage(event, 'pressDossierOptimisticLock'),
          })
        }
      }

      const previousPdfUrl = existingItem?.pdfUrl ?? null
      const pdfUrl = validated.pdfUrl
        ? await finalizeAdminDocument({
            storagePath: validated.pdfUrl,
            uploadDir: PDF_UPLOAD_DIR,
            publicPath: PRESS_DOSSIER_PUBLIC_BASE,
            slug: PRESS_DOSSIER_FILE_SLUG,
            publish: validated.active,
            fallbackBaseName: 'dossier-prensa',
            replaceStoragePath: previousPdfUrl,
          })
        : null
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: validated.pdfUrl,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: [PRESS_DOSSIER_PUBLIC_PATH],
      })

      let upserted = null

      if (existingItem) {
        ;[upserted] = await tx
          .update(pressDossier)
          .set({
            active: validated.active,
            pdfUrl,
          })
          .where(eq(pressDossier.id, existingItem.id))
          .returning()
      } else {
        ;[upserted] = await tx
          .insert(pressDossier)
          .values({
            id: 'singleton',
            pdfUrl,
            active: validated.active,
          })
          .returning()
      }

      if (!upserted) {
        throw createError({
          statusCode: 500,
          message: getAdminApiErrorMessage(event, 'pressDossierSaveFailed'),
        })
      }

      return { previousPdfUrl, upserted }
    })

    if (item.previousPdfUrl && item.previousPdfUrl !== item.upserted.pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: item.previousPdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOSSIER_PUBLIC_PATH],
        },
        'admin.press-dossier.update.cleanup',
        event
      )
    }

    await invalidatePressDossierCache()

    return { data: item.upserted }
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.press-dossier.update.rollback',
      event
    )
    throwAdminMutationError('admin.press-dossier.update', error, event)
  }
})
