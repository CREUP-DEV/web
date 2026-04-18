import { defineEventHandler, readBody, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { runAdminCrudTransaction } from '../../../utils/adminCrud'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { invalidateHomeDataCache } from '../../../utils/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { getPreferredTranslationValue } from '../../../utils/localizedContent'
import { assertOptimisticLock, buildOptimisticLockCondition } from '../../../utils/optimisticLock'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { updateFeaturedLinkSchema } from '~~/shared/utils/adminSchemas'
import { toRelativeSitePath } from '~~/shared/utils/url'

const IMAGE_UPLOAD_DIR = 'public/inicio/imagenes/enlaces-destacados'

function getFeaturedLinkImageSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.featuredLinks.findFirst({
      where: eq(featuredLinks.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const validated = validateBody(updateFeaturedLinkSchema, body)
    const normalizedTo = toRelativeSitePath(validated.to, useRuntimeConfig(event).siteUrl)
    assertOptimisticLock(
      validated.updatedAt,
      existingItem.updatedAt,
      'El enlace fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.'
    )

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
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.image,
      storagePath: image,
      allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
    })

    const item = await runAdminCrudTransaction(async (tx) => {
      await tx
        .delete(featuredLinkTranslations)
        .where(eq(featuredLinkTranslations.featuredLinkId, id))

      const whereCondition = validated.updatedAt
        ? and(
            eq(featuredLinks.id, id),
            buildOptimisticLockCondition(featuredLinks.updatedAt, validated.updatedAt)
          )
        : eq(featuredLinks.id, id)

      const updatedRows = await tx
        .update(featuredLinks)
        .set({
          image,
          to: normalizedTo ?? validated.to,
          order: validated.order,
          active: validated.active,
        })
        .where(whereCondition)
        .returning({ id: featuredLinks.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message:
            'El enlace fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
        })
      }

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
    }, 'No se pudo actualizar el enlace')

    if (previousImage !== image) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousImage,
          allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
        },
        'admin.links.update.cleanup',
        event
      )
    }

    await invalidateHomeDataCache()
    return { data: item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.links.update.rollback', event)
    throwAdminMutationError('admin.links.update', e, event)
  }
})
