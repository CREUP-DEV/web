import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems, carouselItemTranslations } from '../../../db/schema'
import { invalidateHomeDataCache } from '../adminCacheInvalidation'
import { defineAssetBackedTranslatableCrud } from '../defineAssetBackedTranslatableCrud'
import { getPreferredTranslationValue } from '../../locale/localizedContent'
import { HOME_CAROUSEL_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { createCarouselItemSchema, updateCarouselItemSchema } from '~~/shared/utils/adminSchemas'
import { toRelativeSitePath } from '~~/shared/utils/url'

export const carouselCrud = defineAssetBackedTranslatableCrud({
  schema: { create: createCarouselItemSchema, update: updateCarouselItemSchema },
  asset: {
    uploadDir: 'public/inicio/imagenes/carrusel',
    publicPath: HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
    fallbackBaseName: 'banner',
    getSource: (validated) => validated.image ?? null,
    deriveSlug: (validated) => getPreferredTranslationValue(validated.translations, 'title'),
    getPublish: (validated) => validated.active,
  },
  main: {
    table: carouselItems,
    idColumn: carouselItems.id,
    updatedAtColumn: carouselItems.updatedAt,
    buildValues: (validated, { assetPath, event }) => ({
      image: assetPath,
      href: toRelativeSitePath(validated.href, useRuntimeConfig(event).siteUrl) ?? validated.href,
      order: validated.order,
      active: validated.active,
    }),
    loadExisting: async (id) => {
      const existing = await db.query.carouselItems.findFirst({ where: eq(carouselItems.id, id) })
      return existing ? { updatedAt: existing.updatedAt, asset: existing.image } : null
    },
    refetch: (tx, id) =>
      tx.query.carouselItems.findFirst({
        where: eq(carouselItems.id, id),
        with: { translations: true },
      }),
  },
  translations: {
    table: carouselItemTranslations,
    fkColumn: carouselItemTranslations.carouselItemId,
    buildRows: (validated, parentId) =>
      validated.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        buttonText: translation.buttonText ?? '',
        alt: translation.alt || null,
        carouselItemId: parentId,
      })),
  },
  invalidate: invalidateHomeDataCache,
  messages: {
    notFound: 'notFound',
    optimisticLock: 'carouselOptimisticLock',
    createFailed: 'carouselCreateFailed',
    updateFailed: 'carouselUpdateFailed',
  },
  scope: { create: 'admin.carousel.create', update: 'admin.carousel.update' },
})
