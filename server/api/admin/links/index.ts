import { defineEventHandler, readBody, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { getPreferredTranslationValue } from '../../../utils/localizedContent'
import { createFeaturedLinkSchema, validateBody } from '../../../utils/validation'
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const IMAGE_UPLOAD_DIR = 'public/inicio/imagenes/enlaces-destacados'

function getFeaturedLinkImageSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

// GET - List all featured links
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.featuredLinks.findMany({
      orderBy: asc(featuredLinks.order),
      with: { translations: true },
    })
    return { items }
  }

  // POST - Create new featured link
  if (event.method === 'POST') {
    const body = await readBody(event)

    try {
      const validated = validateBody(createFeaturedLinkSchema, body)
      const image = await finalizeAdminImage({
        storagePath: validated.image,
        uploadDir: IMAGE_UPLOAD_DIR,
        publicPath: HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
        slug: getFeaturedLinkImageSlug(validated.translations),
        publish: validated.active,
        fallbackBaseName: 'enlace-destacado',
      })

      const completeItem = await db.transaction(async (tx) => {
        const [item] = await tx
          .insert(featuredLinks)
          .values({
            image,
            to: validated.to,
            order: validated.order,
            active: validated.active,
          })
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: 'No se pudo crear el enlace',
          })
        }

        if (validated.translations.length > 0) {
          await tx.insert(featuredLinkTranslations).values(
            validated.translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title,
              alt: translation.alt || null,
              featuredLinkId: item.id,
            }))
          )
        }

        return tx.query.featuredLinks.findFirst({
          where: eq(featuredLinks.id, item.id),
          with: { translations: true },
        })
      })

      if (validated.image !== image) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.image,
          allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
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
