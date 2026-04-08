import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { pressDossier } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { validateBody } from '../../../utils/validation'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { updatePressDossierSchema } from '~~/shared/utils/adminSchemas'

const PDF_UPLOAD_DIR = 'public/prensa/dossier'
const PRESS_DOSSIER_FILE_SLUG = 'dossier-prensa'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const item = await db.query.pressDossier.findFirst()

    return { item }
  }

  if (event.method === 'PUT') {
    const body = await readBody(event)
    const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

    try {
      const validated = validateBody(updatePressDossierSchema, body)
      const existingItem = await db.query.pressDossier.findFirst()
      const previousPdfUrl = existingItem?.pdfUrl ?? null

      const pdfUrl = validated.pdfUrl
        ? await finalizeAdminDocument({
            storagePath: validated.pdfUrl,
            uploadDir: PDF_UPLOAD_DIR,
            publicPath: PRESS_DOSSIER_PUBLIC_PATH,
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

      const item = await db.transaction(async (tx) => {
        const [upserted] = await tx
          .insert(pressDossier)
          .values({
            id: 'singleton',
            pdfUrl,
            active: validated.active,
          })
          .onConflictDoUpdate({
            target: pressDossier.id,
            set: { pdfUrl, active: validated.active },
          })
          .returning()

        if (!upserted) {
          throw createError({ statusCode: 500, message: 'No se pudo guardar el dossier' })
        }

        return upserted
      })

      if (previousPdfUrl && previousPdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAssetSafely(
          {
            storagePath: previousPdfUrl,
            allowedPublicPathPrefixes: [PRESS_DOSSIER_PUBLIC_PATH],
          },
          'admin.press-dossier.update.cleanup',
          event
        )
      }

      return { item }
    } catch (error) {
      await cleanupAdminAssetFinalizationsSafely(
        cleanupTargets,
        'admin.press-dossier.update.rollback',
        event
      )

      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
