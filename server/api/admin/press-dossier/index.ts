import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressDossier } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { updatePressDossierSchema, validateBody } from '../../../utils/validation'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const PDF_UPLOAD_DIR = 'public/prensa/dossier'
const PRESS_DOSSIER_FILE_SLUG = 'dossier-prensa'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const item = await db.query.pressDossier.findFirst()

    return { item }
  }

  if (event.method === 'PUT') {
    const body = await readBody(event)

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

      const item = await db.transaction(async (tx) => {
        if (!existingItem) {
          const [created] = await tx
            .insert(pressDossier)
            .values({
              pdfUrl,
              active: validated.active,
            })
            .returning()

          if (!created) {
            throw createError({ statusCode: 500, message: 'No se pudo guardar el dossier' })
          }

          return created
        }

        await tx
          .update(pressDossier)
          .set({
            pdfUrl,
            active: validated.active,
          })
          .where(eq(pressDossier.id, existingItem.id))

        return tx.query.pressDossier.findFirst({
          where: eq(pressDossier.id, existingItem.id),
        })
      })

      if (previousPdfUrl && previousPdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: previousPdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOSSIER_PUBLIC_PATH],
        })
      }

      return { item }
    } catch (error) {
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
