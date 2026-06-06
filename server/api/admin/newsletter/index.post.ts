import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import {
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  type CleanupUnusedAdminAssetOptions,
  trackAdminAssetFinalization,
} from '../../../utils/admin/adminAssetPublication'
import { invalidateNewsletterArchiveCache } from '../../../utils/admin/adminCacheInvalidation'
import { enqueueNewsletterSendJob } from '../../../utils/core/backgroundJobs'
import { finalizeAdminDocument } from '../../../utils/admin/adminDocumentUpload'
import { finalizeAdminImage } from '../../../utils/admin/adminImageUpload'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { ensureSmtpTransporterVerified } from '../../../utils/email/smtpTransporter'
import { validateBody } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
} from '../../../utils/newsletter/newsletters'
import { claimNewsletterForSending } from '../../../services/newsletterDeliveryService'
import {
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'
import { createNewsletterRequestSchema } from '~~/shared/utils/adminSchemas'

const COVER_IMAGE_UPLOAD_DIR = 'public/prensa/newsletter/portadas'
const DOCUMENT_UPLOAD_DIR = 'public/prensa/newsletter/documentos'

const buildNewsletterCoverSlug = (monthKey: string) => `newsletter-${monthKey}-portada`
const buildNewsletterDocumentSlug = (monthKey: string) => `newsletter-${monthKey}`

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let createdNewsletterId: string | null = null
  let coverImage: string | null = null
  let pdfUrl: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(event, createNewsletterRequestSchema, body)

    if (validated.sendEmail) {
      try {
        await ensureSmtpTransporterVerified(getAdminApiErrorMessage(event, 'smtpIncomplete'))
      } catch {
        throw createError({
          statusCode: 503,
          message: getAdminApiErrorMessage(event, 'smtpConnectionFailed'),
        })
      }
    }

    const sendEmail = validated.sendEmail
    const { monthDate, monthKey } = normalizeNewsletterMonthInput(validated.month)

    await assertNewsletterMonthAvailable(monthKey)
    const item = await db.transaction(async (tx) => {
      if (validated.coverImage) {
        coverImage = await finalizeAdminImage({
          storagePath: validated.coverImage,
          uploadDir: COVER_IMAGE_UPLOAD_DIR,
          publicPath: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
          slug: buildNewsletterCoverSlug(monthKey),
          publish: validated.publicVisible,
          fallbackBaseName: 'newsletter-portada',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: validated.coverImage,
          storagePath: coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        })
      } else {
        coverImage = null
      }

      pdfUrl = await finalizeAdminDocument({
        storagePath: validated.pdfUrl,
        uploadDir: DOCUMENT_UPLOAD_DIR,
        publicPath: NEWSLETTER_DOCUMENT_PUBLIC_PATH,
        slug: buildNewsletterDocumentSlug(monthKey),
        publish: validated.publicVisible,
        fallbackBaseName: 'newsletter',
      })
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: validated.pdfUrl,
        storagePath: pdfUrl,
        allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
      })

      const [inserted] = await tx
        .insert(newsletters)
        .values({
          month: monthDate,
          monthKey,
          coverImage,
          pdfUrl,
          publicVisible: validated.publicVisible,
        })
        .returning()

      if (!inserted) {
        throw createError({
          statusCode: 500,
          message: getAdminApiErrorMessage(event, 'newsletterCreateFailed'),
        })
      }

      return inserted
    })

    if (!item) {
      throw createError({
        statusCode: 500,
        message: getAdminApiErrorMessage(event, 'newsletterCreateFailed'),
      })
    }
    createdNewsletterId = item.id

    if (validated.coverImage && coverImage && validated.coverImage !== coverImage) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        },
        'admin.newsletter.create.cleanup.cover',
        event
      )
    }

    if (validated.pdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        },
        'admin.newsletter.create.cleanup.pdf',
        event
      )
    }

    const queuedItem = sendEmail ? await claimNewsletterForSending(item.id, event) : item

    if (sendEmail) {
      await enqueueNewsletterSendJob({
        newsletterId: queuedItem.id,
        workerToken: queuedItem.lastDeliveryWorkerToken ?? '',
      })
    }

    await invalidateNewsletterArchiveCache()

    const normalizedItem = {
      ...(queuedItem ?? item),
      month: monthKeyToDate((queuedItem ?? item).monthKey),
      isSending: Boolean((queuedItem ?? item).lastDeliveryWorkerToken),
    }
    const emailQueued = sendEmail

    return {
      data: {
        item: normalizedItem,
        emailQueued,
      },
    }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.newsletter.create.rollback',
      event
    )

    if (!createdNewsletterId && coverImage) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        },
        'admin.newsletter.create.rollback.cover',
        event
      )
    }

    if (!createdNewsletterId && pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: pdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        },
        'admin.newsletter.create.rollback.pdf',
        event
      )
    }

    throwAdminMutationError('admin.newsletter.create', e, event)
  }
})
