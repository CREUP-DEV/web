import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { getPreferredTranslationValue } from '../../../utils/localizedContent'
import {
  idRouteParamSchema,
  updateFeaturedLinkSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const IMAGE_UPLOAD_DIR = 'public/inicio/imagenes/enlaces-destacados'

function getFeaturedLinkImageSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  // GET - Get single featured link
  if (event.method === 'GET') {
    const item = await db.query.featuredLinks.findFirst({
      where: eq(featuredLinks.id, id),
      with: { translations: true },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update featured link
  if (event.method === 'PUT') {
    const body = await readBody(event)

    try {
      const existingItem = await db.query.featuredLinks.findFirst({
        where: eq(featuredLinks.id, id),
      })

      if (!existingItem) {
        throw createError({ statusCode: 404, message: 'No encontrado' })
      }

      const validated = validateBody(updateFeaturedLinkSchema, body)
      const previousImage = existingItem.image
      const image = await finalizeAdminImage({
        storagePath: validated.image,
        uploadDir: IMAGE_UPLOAD_DIR,
        publicPath: HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        slug: getFeaturedLinkImageSlug(validated.translations),
        publish: validated.active,
        fallbackBaseName: 'enlace-destacado',
        replaceStoragePath: existingItem.image,
      })

      const item = await db.transaction(async (tx) => {
        await tx
          .delete(featuredLinkTranslations)
          .where(eq(featuredLinkTranslations.featuredLinkId, id))

        await tx
          .update(featuredLinks)
          .set({
            image,
            to: validated.to,
            order: validated.order,
            active: validated.active,
          })
          .where(eq(featuredLinks.id, id))

        if (validated.translations.length > 0) {
          await tx.insert(featuredLinkTranslations).values(
            validated.translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title,
              alt: translation.alt || null,
              featuredLinkId: id,
            }))
          )
        }

        return tx.query.featuredLinks.findFirst({
          where: eq(featuredLinks.id, id),
          with: { translations: true },
        })
      })

      if (previousImage !== image) {
        await cleanupUnusedAdminAsset({
          storagePath: previousImage,
          allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
        })
      }

      return { item }
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'statusCode' in e) {
        throw e
      }

      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete featured link
  if (event.method === 'DELETE') {
    const existingItem = await db.query.featuredLinks.findFirst({
      where: eq(featuredLinks.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    await db.delete(featuredLinks).where(eq(featuredLinks.id, id))

    await cleanupUnusedAdminAsset({
      storagePath: existingItem.image,
      allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
    })

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
