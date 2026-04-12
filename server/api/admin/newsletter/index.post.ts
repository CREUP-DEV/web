import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import {
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  type CleanupUnusedAdminAssetOptions,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { enqueueNewsletterSendJob } from '../../../utils/backgroundJobs'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { getSmtpTransporter } from '../../../utils/smtpTransporter'
import { validateBody } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
} from '../../../utils/newsletters'
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
    const validated = validateBody(createNewsletterRequestSchema, body)

    if (validated.sendEmail) {
      const transporter = getSmtpTransporter(
        'La configuración SMTP es incompleta. Configura el servidor SMTP antes de enviar newsletters.'
      )
      try {
        await transporter.verify()
      } catch {
        throw createError({
          statusCode: 503,
          message:
            'No se puede conectar al servidor de correo. Verifica la configuración SMTP antes de enviar.',
        })
      }
    }

    const sendEmail = validated.sendEmail
    const { monthDate, monthKey } = normalizeNewsletterMonthInput(validated.month)

    await assertNewsletterMonthAvailable(monthKey)
    const item = await db.transaction(async (tx) => {
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
          active: validated.active,
          publicVisible: validated.publicVisible,
        })
        .returning()

      if (!inserted) {
        throw createError({ statusCode: 500, message: 'Error al crear la newsletter' })
      }

      return inserted
    })

    if (!item) {
      throw createError({ statusCode: 500, message: 'Error al crear la newsletter' })
    }
    createdNewsletterId = item.id

    if (validated.coverImage !== coverImage) {
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

    const queuedItem = sendEmail && item.active ? await claimNewsletterForSending(item.id) : item

    if (sendEmail && queuedItem.active) {
      await enqueueNewsletterSendJob({
        newsletterId: queuedItem.id,
        workerToken: queuedItem.lastDeliveryWorkerToken ?? '',
      })
    }

    const normalizedItem = {
      ...(queuedItem ?? item),
      month: monthKeyToDate((queuedItem ?? item).monthKey),
    }
    const emailQueued = sendEmail && queuedItem.active

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
