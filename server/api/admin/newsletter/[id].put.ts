import { ADMIN_NOT_FOUND_MESSAGE } from '~~/shared/constants/adminMessages'
import { createError, defineEventHandler, readBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import {
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  type CleanupUnusedAdminAssetOptions,
  trackAdminAssetFinalization,
} from '../../../utils/admin/adminAssetPublication'
import { invalidateNewsletterArchiveCache } from '../../../utils/admin/adminCacheInvalidation'
import { finalizeAdminDocument } from '../../../utils/admin/adminDocumentUpload'
import { finalizeAdminImage } from '../../../utils/admin/adminImageUpload'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import {
  assertOptimisticLock,
  buildOptimisticLockCondition,
} from '../../../utils/admin/optimisticLock'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
} from '../../../utils/newsletter/newsletters'
import {
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'
import { updateNewsletterSchema } from '~~/shared/utils/adminSchemas'

const COVER_IMAGE_UPLOAD_DIR = 'public/prensa/newsletter/portadas'
const DOCUMENT_UPLOAD_DIR = 'public/prensa/newsletter/documentos'

const OPTIMISTIC_LOCK_MESSAGE =
  'La newsletter fue modificada por otro usuario. Recarga la página para ver los cambios más recientes.'

const buildNewsletterCoverSlug = (monthKey: string) => `newsletter-${monthKey}-portada`
const buildNewsletterDocumentSlug = (monthKey: string) => `newsletter-${monthKey}`

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)

  let dbUpdated = false
  let previousCoverImage: string | null = null
  let previousPdfUrl: string | null = null
  let coverImage: string | null = null
  let pdfUrl: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: ADMIN_NOT_FOUND_MESSAGE })
    }

    const validated = validateBody(updateNewsletterSchema, body)
    assertOptimisticLock(validated.updatedAt, existingItem.updatedAt, OPTIMISTIC_LOCK_MESSAGE)

    const { monthDate, monthKey } = normalizeNewsletterMonthInput(validated.month)

    await assertNewsletterMonthAvailable(monthKey, id)
    previousCoverImage = existingItem.coverImage
    previousPdfUrl = existingItem.pdfUrl
    const item = await db.transaction(async (tx) => {
      if (validated.coverImage === existingItem.coverImage) {
        coverImage = existingItem.coverImage
      } else if (!validated.coverImage) {
        coverImage = null
      } else {
        coverImage = await finalizeAdminImage({
          storagePath: validated.coverImage,
          uploadDir: COVER_IMAGE_UPLOAD_DIR,
          publicPath: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
          slug: buildNewsletterCoverSlug(monthKey),
          publish: validated.publicVisible,
          fallbackBaseName: 'newsletter-portada',
          replaceStoragePath: existingItem.coverImage,
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: validated.coverImage,
          storagePath: coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        })
      }

      pdfUrl = await finalizeAdminDocument({
        storagePath: validated.pdfUrl,
        uploadDir: DOCUMENT_UPLOAD_DIR,
        publicPath: NEWSLETTER_DOCUMENT_PUBLIC_PATH,
        slug: buildNewsletterDocumentSlug(monthKey),
        publish: validated.publicVisible,
        fallbackBaseName: 'newsletter',
        replaceStoragePath: existingItem.pdfUrl,
      })
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: validated.pdfUrl,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
      })

      const whereCondition = validated.updatedAt
        ? and(
            eq(newsletters.id, id),
            buildOptimisticLockCondition(newsletters.updatedAt, validated.updatedAt)
          )
        : eq(newsletters.id, id)

      const updatedRows = await tx
        .update(newsletters)
        .set({
          month: monthDate,
          monthKey,
          coverImage,
          pdfUrl,
          publicVisible: validated.publicVisible,
        })
        .where(whereCondition)
        .returning({ id: newsletters.id })

      if (updatedRows.length === 0) {
        throw createError({ statusCode: 409, message: OPTIMISTIC_LOCK_MESSAGE })
      }

      return tx.query.newsletters.findFirst({
        where: eq(newsletters.id, id),
      })
    })
    dbUpdated = true

    if (previousCoverImage !== coverImage) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousCoverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        },
        'admin.newsletter.update.cleanup.cover',
        event
      )
    }

    if (previousPdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousPdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        },
        'admin.newsletter.update.cleanup.pdf',
        event
      )
    }

    await invalidateNewsletterArchiveCache()

    const normalizedItem = item
      ? {
          ...item,
          month: monthKeyToDate(item.monthKey),
          isSending: Boolean(item?.lastDeliveryWorkerToken ?? false),
        }
      : null

    return {
      data: normalizedItem,
    }
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.newsletter.update.rollback',
      event
    )

    if (!dbUpdated && coverImage && coverImage !== previousCoverImage) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        },
        'admin.newsletter.update.rollback.cover',
        event
      )
    }

    if (!dbUpdated && pdfUrl && pdfUrl !== previousPdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: pdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        },
        'admin.newsletter.update.rollback.pdf',
        event
      )
    }

    throwAdminMutationError('admin.newsletter.update', error, event)
  }
})
