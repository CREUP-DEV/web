import { createError, defineEventHandler, readBody } from 'h3'
import { and, eq } from 'drizzle-orm'
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
import {
  assertOptimisticLock,
  buildExpectedVersionCondition,
} from '../../../utils/admin/optimisticLock'
import { validateBody } from '../../../utils/validation'
import { PRESS_DOSSIER_STORAGE_PATH } from '~~/shared/constants/assetPaths'
import { updatePressDossierSchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  isLegacyPressDossierPath,
  LEGACY_PRESS_DOSSIER_BASE,
} from '../../../utils/press/pressDossier'

const PRESS_DOSSIER_FILE_SLUG = 'dossier-prensa'
// Cleanup may only touch dossier files: the storage folder, plus the legacy location under /prensa
// that the first upload after the move leaves behind. Never the other press documents.
const PRESS_DOSSIER_CLEANUP_PREFIXES = [
  `${PRESS_DOSSIER_STORAGE_PATH}/`,
  `${LEGACY_PRESS_DOSSIER_BASE}/${PRESS_DOSSIER_FILE_SLUG}`,
]

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(event, updatePressDossierSchema, body)
    const optimisticLockMessage = getAdminApiErrorMessage(event, 'pressDossierOptimisticLock')

    const item = await db.transaction(async (tx) => {
      const existingItem = await tx.query.pressDossier.findFirst()

      if (existingItem) {
        assertOptimisticLock(validated.updatedAt, existingItem.updatedAt, optimisticLockMessage)
      }

      const previousPdfUrl = existingItem?.pdfUrl ?? null
      // A dossier not uploaded since storage moved still lives directly under /prensa; finalized
      // against the new folder it would be rejected as out of place, so it keeps its own until the
      // admin uploads it again (the startup reconcile follows the same rule).
      const dossierPublicPath = isLegacyPressDossierPath(validated.pdfUrl)
        ? LEGACY_PRESS_DOSSIER_BASE
        : PRESS_DOSSIER_STORAGE_PATH
      const pdfUrl = validated.pdfUrl
        ? await finalizeAdminDocument({
            storagePath: validated.pdfUrl,
            uploadDir: `public${dossierPublicPath}`,
            publicPath: dossierPublicPath,
            slug: PRESS_DOSSIER_FILE_SLUG,
            publish: validated.active,
            fallbackBaseName: 'dossier-prensa',
            replaceStoragePath: previousPdfUrl,
          })
        : null
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: validated.pdfUrl,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: PRESS_DOSSIER_CLEANUP_PREFIXES,
      })

      let upserted = null

      // The check above ran on a plain read, so two saves can both pass it; the write itself only
      // matches the version that was read (and the first save creates the row exactly once), so the
      // second one gets a 409 instead of silently overwriting the first.
      if (existingItem) {
        ;[upserted] = await tx
          .update(pressDossier)
          .set({
            active: validated.active,
            pdfUrl,
          })
          .where(
            and(
              eq(pressDossier.id, existingItem.id),
              buildExpectedVersionCondition(
                pressDossier.updatedAt,
                validated.updatedAt,
                existingItem.updatedAt
              )
            )
          )
          .returning()
      } else {
        ;[upserted] = await tx
          .insert(pressDossier)
          .values({
            id: 'singleton',
            pdfUrl,
            active: validated.active,
          })
          .onConflictDoNothing()
          .returning()
      }

      if (!upserted) {
        throw createError({ statusCode: 409, message: optimisticLockMessage })
      }

      return { previousPdfUrl, upserted }
    })

    if (item.previousPdfUrl && item.previousPdfUrl !== item.upserted.pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: item.previousPdfUrl,
          allowedPublicPathPrefixes: PRESS_DOSSIER_CLEANUP_PREFIXES,
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
