import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems, carouselItemTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  let image: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

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
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.image,
      storagePath: nextImage,
      allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
      protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
    })

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
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.image,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
        },
        'admin.carousel.create.cleanup',
        event
      )
    }

    return { item: completeItem }
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.carousel.create.rollback',
      event
    )

    throwAdminMutationError('admin.carousel.create', error, event)
  }
})
