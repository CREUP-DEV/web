import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems, carouselItemTranslations } from '../../../db/schema'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { runAdminCrudTransaction } from '../../../utils/adminCrud'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { invalidateHomeDataCache } from '../../../utils/adminCacheInvalidation'
import { getPreferredTranslationValue } from '../../../utils/localizedContent'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import {
  HOME_CAROUSEL_FALLBACK_IMAGE,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'
import { updateCarouselItemSchema } from '~~/shared/utils/adminSchemas'

const IMAGE_UPLOAD_DIR = 'public/inicio/imagenes/carrusel'

function getCarouselImageSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)

  let dbUpdated = false
  let previousImage: string | null = null
  let image: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.carouselItems.findFirst({
      where: eq(carouselItems.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const validated = validateBody(updateCarouselItemSchema, body)
    previousImage = existingItem.image
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
            replaceStoragePath: existingItem.image,
          })
    image = nextImage
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.image,
      storagePath: nextImage,
      allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
      protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
    })

    const item = await runAdminCrudTransaction(async (tx) => {
      await tx
        .delete(carouselItemTranslations)
        .where(eq(carouselItemTranslations.carouselItemId, id))

      await tx
        .update(carouselItems)
        .set({
          image: nextImage,
          href: validated.href,
          order: validated.order,
          active: validated.active,
        })
        .where(eq(carouselItems.id, id))

      if (validated.translations.length > 0) {
        await tx.insert(carouselItemTranslations).values(
          validated.translations.map((translation) => ({
            locale: translation.locale,
            title: translation.title,
            buttonText: translation.buttonText ?? '',
            alt: translation.alt || null,
            carouselItemId: id,
          }))
        )
      }

      return tx.query.carouselItems.findFirst({
        where: eq(carouselItems.id, id),
        with: { translations: true },
      })
    }, 'No se pudo actualizar el elemento del carrusel')
    dbUpdated = true

    if (previousImage !== image) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousImage,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
        },
        'admin.carousel.update.cleanup',
        event
      )
    }

    await invalidateHomeDataCache()
    return { item }
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.carousel.update.rollback',
      event
    )

    if (!dbUpdated && image && image !== previousImage) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: image,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
        },
        'admin.carousel.update.rollback.cleanup',
        event
      )
    }

    throwAdminMutationError('admin.carousel.update', error, event)
  }
})
