import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { invalidateHomeDataCache } from '../../../utils/adminCacheInvalidation'
import { runAdminCrudTransaction } from '../../../utils/adminCrud'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { getPreferredTranslationValue } from '../../../utils/localizedContent'
import { validateBody } from '../../../utils/validation'
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { createFeaturedLinkSchema } from '~~/shared/utils/adminSchemas'

const IMAGE_UPLOAD_DIR = 'public/inicio/imagenes/enlaces-destacados'

function getFeaturedLinkImageSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

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
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.image,
      storagePath: image,
      allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
    })

    const completeItem = await runAdminCrudTransaction(async (tx) => {
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
        return null
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
    }, 'No se pudo crear el enlace')

    if (validated.image !== image) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.image,
          allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
        },
        'admin.links.create.cleanup',
        event
      )
    }

    await invalidateHomeDataCache()
    return { data: completeItem }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.links.create.rollback', event)
    throwAdminMutationError('admin.links.create', e, event)
  }
})
