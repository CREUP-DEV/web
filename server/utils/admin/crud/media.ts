import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { invalidatePressCache } from '../adminCacheInvalidation'
import { defineAssetBackedTranslatableCrud } from '../defineAssetBackedTranslatableCrud'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { createMediaOutletSchema, updateMediaOutletSchema } from '~~/shared/utils/adminSchemas'

// Single-language resource: no translation table, so the factory's `translations` block is omitted.
export const mediaCrud = defineAssetBackedTranslatableCrud({
  schema: { create: createMediaOutletSchema, update: updateMediaOutletSchema },
  asset: {
    uploadDir: 'public/prensa/imagenes/medios',
    publicPath: PRESS_MEDIA_LOGO_PUBLIC_PATH,
    fallbackBaseName: 'medio',
    getSource: (validated) => validated.logo,
    deriveSlug: (validated) => validated.name,
  },
  main: {
    table: mediaOutlets,
    idColumn: mediaOutlets.id,
    updatedAtColumn: mediaOutlets.updatedAt,
    buildValues: (validated, { assetPath }) => ({
      name: validated.name,
      website: validated.website,
      logo: assetPath,
      order: validated.order,
    }),
    loadExisting: async (id) => {
      const existing = await db.query.mediaOutlets.findFirst({ where: eq(mediaOutlets.id, id) })
      return existing ? { updatedAt: existing.updatedAt, asset: existing.logo } : null
    },
    refetch: (tx, id) => tx.query.mediaOutlets.findFirst({ where: eq(mediaOutlets.id, id) }),
  },
  invalidate: invalidatePressCache,
  messages: {
    notFound: 'notFound',
    optimisticLock: 'mediaOptimisticLock',
    createFailed: 'mediaCreateFailed',
    updateFailed: 'mediaUpdateFailed',
  },
  scope: { create: 'admin.media.create', update: 'admin.media.update' },
})
