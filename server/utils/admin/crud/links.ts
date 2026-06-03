import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { invalidateHomeDataCache } from '../adminCacheInvalidation'
import { defineAssetBackedTranslatableCrud } from '../defineAssetBackedTranslatableCrud'
import { getPreferredTranslationValue } from '../../locale/localizedContent'
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { createFeaturedLinkSchema, updateFeaturedLinkSchema } from '~~/shared/utils/adminSchemas'
import { toRelativeSitePath } from '~~/shared/utils/url'

const OPTIMISTIC_LOCK_MESSAGE =
  'El enlace fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.'

export const linksCrud = defineAssetBackedTranslatableCrud({
  schema: { create: createFeaturedLinkSchema, update: updateFeaturedLinkSchema },
  asset: {
    uploadDir: 'public/inicio/imagenes/enlaces-destacados',
    publicPath: HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
    fallbackBaseName: 'enlace-destacado',
    getSource: (validated) => validated.image,
    deriveSlug: (validated) => getPreferredTranslationValue(validated.translations, 'title'),
    getPublish: (validated) => validated.active,
  },
  main: {
    table: featuredLinks,
    idColumn: featuredLinks.id,
    updatedAtColumn: featuredLinks.updatedAt,
    buildValues: (validated, { assetPath, event }) => ({
      image: assetPath,
      to: toRelativeSitePath(validated.to, useRuntimeConfig(event).siteUrl) ?? validated.to,
      order: validated.order,
      active: validated.active,
    }),
    loadExisting: async (id) => {
      const existing = await db.query.featuredLinks.findFirst({ where: eq(featuredLinks.id, id) })
      return existing ? { updatedAt: existing.updatedAt, asset: existing.image } : null
    },
    refetch: (tx, id) =>
      tx.query.featuredLinks.findFirst({
        where: eq(featuredLinks.id, id),
        with: { translations: true },
      }),
  },
  translations: {
    table: featuredLinkTranslations,
    fkColumn: featuredLinkTranslations.featuredLinkId,
    buildRows: (validated, parentId) =>
      validated.translations.map((translation) => ({
        locale: translation.locale,
        title: translation.title,
        alt: translation.alt || null,
        featuredLinkId: parentId,
      })),
  },
  invalidate: invalidateHomeDataCache,
  messages: {
    notFound: 'No encontrado',
    optimisticLock: OPTIMISTIC_LOCK_MESSAGE,
    createFailed: 'No se pudo crear el enlace',
    updateFailed: 'No se pudo actualizar el enlace',
  },
  scope: { create: 'admin.links.create', update: 'admin.links.update' },
})
