import { defineEventHandler, readBody, createError } from 'h3'
import { desc } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { runInBackground } from '../../../utils/backgroundTask'
import { createNewsletterSchema, validateBody } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  claimNewsletterForSending,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
  processPendingNewsletterDeliveries,
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
  if (event.method === 'GET') {
    const items = await db.select().from(newsletters).orderBy(desc(newsletters.month))

    return {
      items: items.map((item) => ({
        ...item,
        month: monthKeyToDate(item.monthKey),
      })),
    }
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    let createdNewsletterId: string | null = null
    let coverImage: string | null = null
    let pdfUrl: string | null = null

    try {
      const validated = validateBody(createNewsletterSchema, body)
      const sendEmail = body.sendEmail === true
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
      pdfUrl = await finalizeAdminDocument({
        storagePath: validated.pdfUrl,
        uploadDir: DOCUMENT_UPLOAD_DIR,
        publicPath: NEWSLETTER_DOCUMENT_PUBLIC_PATH,
        slug: buildNewsletterDocumentSlug(monthKey),
        publish: validated.active,
        fallbackBaseName: 'newsletter',
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
        throw createError({ statusCode: 500, statusMessage: 'Error al crear la newsletter' })
      }
      createdNewsletterId = item.id

      if (validated.coverImage !== coverImage) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        })
      }

      if (validated.pdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        })
      }

      const queuedItem = sendEmail && item.active ? await claimNewsletterForSending(item.id) : item

      if (sendEmail && queuedItem.active) {
        runInBackground(event, 'admin.newsletter.create-send', processPendingNewsletterDeliveries())
      }

      return {
        item: {
          ...(queuedItem ?? item),
          month: monthKeyToDate((queuedItem ?? item).monthKey),
        },
        emailQueued: sendEmail && queuedItem.active,
      }
    } catch (e) {
      if (!createdNewsletterId && coverImage) {
        await cleanupUnusedAdminAsset({
          storagePath: coverImage,
          allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
        })
      }

      if (!createdNewsletterId && pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: pdfUrl,
          allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
        })
      }

      throwAdminMutationError('admin.newsletter.create', e, event)
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
