import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import {
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  type CleanupUnusedAdminAssetOptions,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import {
  idRouteParamSchema,
  updateNewsletterSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
} from '../../../utils/newsletters'
import {
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'

const COVER_IMAGE_UPLOAD_DIR = 'public/prensa/newsletter/portadas'
const DOCUMENT_UPLOAD_DIR = 'public/prensa/newsletter/documentos'

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
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const validated = validateBody(updateNewsletterSchema, body)
    const { monthDate, monthKey } = normalizeNewsletterMonthInput(validated.month)

    await assertNewsletterMonthAvailable(monthKey, id)
    previousCoverImage = existingItem.coverImage
    previousPdfUrl = existingItem.pdfUrl
    coverImage = await finalizeAdminImage({
      storagePath: validated.coverImage,
      uploadDir: COVER_IMAGE_UPLOAD_DIR,
      publicPath: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
      slug: buildNewsletterCoverSlug(monthKey),
      publish: validated.active,
      fallbackBaseName: 'newsletter-portada',
      replaceStoragePath: existingItem.coverImage,
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.coverImage,
      storagePath: coverImage,
      allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
    })
    pdfUrl = await finalizeAdminDocument({
      storagePath: validated.pdfUrl,
      uploadDir: DOCUMENT_UPLOAD_DIR,
      publicPath: NEWSLETTER_DOCUMENT_PUBLIC_PATH,
      slug: buildNewsletterDocumentSlug(monthKey),
      publish: validated.active,
      fallbackBaseName: 'newsletter',
      replaceStoragePath: existingItem.pdfUrl,
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.pdfUrl,
      storagePath: pdfUrl,
      allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
    })

    await db
      .update(newsletters)
      .set({
        month: monthDate,
        monthKey,
        coverImage,
        pdfUrl,
        active: validated.active,
      })
      .where(eq(newsletters.id, id))
    dbUpdated = true

    const item = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, id),
    })

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

    return {
      item: item
        ? {
            ...item,
            month: monthKeyToDate(item.monthKey),
          }
        : null,
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
