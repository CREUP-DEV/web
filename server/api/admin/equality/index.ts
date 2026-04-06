import { defineEventHandler, readBody, createError } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments, equalityDocumentTranslations } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import {
  filterTranslationsByContent,
  getPreferredTranslationValue,
} from '../../../utils/localizedContent'
import { createEqualityDocumentSchema, validateBody } from '../../../utils/validation'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const PDF_UPLOAD_DIR = 'public/documentos/igualdad'

function getEqualityDocumentSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.equalityDocuments.findMany({
      orderBy: asc(equalityDocuments.order),
      with: {
        translations: true,
      },
    })

    return { items }
  }

  if (event.method === 'POST') {
    const body = await readBody(event)

    try {
      const validated = validateBody(createEqualityDocumentSchema, body)
      const pdfUrl = await finalizeAdminDocument({
        storagePath: validated.pdfUrl,
        uploadDir: PDF_UPLOAD_DIR,
        publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
        slug: getEqualityDocumentSlug(validated.translations),
        publish: validated.active,
        fallbackBaseName: 'documento-igualdad',
      })
      const translationsToCreate = filterTranslationsByContent(
        validated.translations,
        (translation) =>
          translation.title.trim() !== '' ||
          translation.description.trim() !== '' ||
          Boolean(translation.meta?.trim())
      )

      const completeItem = await db.transaction(async (tx) => {
        const [item] = await tx
          .insert(equalityDocuments)
          .values({
            pdfUrl,
            order: validated.order,
            active: validated.active,
          })
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: 'No se pudo crear el documento de igualdad',
          })
        }

        if (translationsToCreate.length > 0) {
          await tx.insert(equalityDocumentTranslations).values(
            translationsToCreate.map((translation) => ({
              locale: translation.locale,
              title: translation.title.trim(),
              description: translation.description.trim(),
              meta: translation.meta?.trim() || null,
              equalityDocumentId: item.id,
            }))
          )
        }

        return tx.query.equalityDocuments.findFirst({
          where: eq(equalityDocuments.id, item.id),
          with: {
            translations: true,
          },
        })
      })

      if (validated.pdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
        })
      }

      return { item: completeItem }
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e) {
        throw e
      }

      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
