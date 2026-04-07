import { defineEventHandler, readBody, createError } from 'h3'
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
import { runInBackground } from '../../../utils/backgroundTask'
import { getSmtpTransporter } from '../../../utils/smtpTransporter'
import { createNewsletterRequestSchema, validateBody } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  claimNewsletterForSending,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
  processNewsletterDeliveryRun,
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
    coverImage = await finalizeAdminImage({
      storagePath: validated.coverImage,
      uploadDir: COVER_IMAGE_UPLOAD_DIR,
      publicPath: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
      slug: buildNewsletterCoverSlug(monthKey),
      publish: validated.active,
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
      publish: validated.active,
      fallbackBaseName: 'newsletter',
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.pdfUrl,
      storagePath: pdfUrl,
      allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
    })

    const [item] = await db
      .insert(newsletters)
      .values({
        month: monthDate,
        monthKey,
        coverImage,
        pdfUrl,
        active: validated.active,
        sending: false,
      })
      .returning()

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
      runInBackground(
        event,
        'admin.newsletter.create-send',
        processNewsletterDeliveryRun(queuedItem)
      )
    }

    return {
      item: {
        ...(queuedItem ?? item),
        month: monthKeyToDate((queuedItem ?? item).monthKey),
      },
      emailQueued: sendEmail && queuedItem.active,
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
