import { defineEventHandler, readBody, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems, carouselItemTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { getPreferredTranslationValue } from '../../../utils/localizedContent'
import { createCarouselItemSchema, validateBody } from '../../../utils/validation'
import {
  HOME_CAROUSEL_FALLBACK_IMAGE,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'

const IMAGE_UPLOAD_DIR = 'public/inicio/imagenes/carrusel'

function getCarouselImageSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

// GET - List all carousel items
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.carouselItems.findMany({
      orderBy: asc(carouselItems.order),
      with: { translations: true },
    })
    return { items }
  }

  // POST - Create new carousel item
  if (event.method === 'POST') {
    const body = await readBody(event)
    let createdItemId: string | null = null
    let image: string | null = null

    try {
      const validated = validateBody(createCarouselItemSchema, body)
      const nextImage =
        validated.image === HOME_CAROUSEL_FALLBACK_IMAGE
          ? HOME_CAROUSEL_FALLBACK_IMAGE
          : await finalizeAdminImage({
              storagePath: validated.image,
              uploadDir: IMAGE_UPLOAD_DIR,
              publicPath: HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
              slug: getCarouselImageSlug(validated.translations),
              publish: validated.active,
              fallbackBaseName: 'banner',
            })
      image = nextImage

      const completeItem = await db.transaction(async (tx) => {
        const [item] = await tx
          .insert(carouselItems)
          .values({
            image: nextImage,
            href: validated.href,
            order: validated.order,
            active: validated.active,
          })
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: 'No se pudo crear el elemento del carrusel',
          })
        }
        createdItemId = item.id

        if (validated.translations.length > 0) {
          await tx.insert(carouselItemTranslations).values(
            validated.translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title,
              buttonText: translation.buttonText ?? '',
              alt: translation.alt || null,
              carouselItemId: item.id,
            }))
          )
        }

        return tx.query.carouselItems.findFirst({
          where: eq(carouselItems.id, item.id),
          with: { translations: true },
        })
      })

      if (validated.image !== image) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.image,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
        })
      }

      return { item: completeItem }
    } catch (error) {
      if (!createdItemId && image && image !== HOME_CAROUSEL_FALLBACK_IMAGE) {
        await cleanupUnusedAdminAsset({
          storagePath: image,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
        })
      }

      throwAdminMutationError('admin.carousel.create', error, event)
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
