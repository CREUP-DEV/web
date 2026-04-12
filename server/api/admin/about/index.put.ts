import { createError, defineEventHandler, readBody } from 'h3'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { db } from '../../../db'
import { aboutPageContent } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { updateAboutPageContentSchema, validateBody } from '../../../utils/validation'
import { ABOUT_HERO_DEFAULT_IMAGE, ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const ABOUT_IMAGE_UPLOAD_DIR = 'public/conocenos/imagenes'
const ABOUT_HERO_SLUG = 'banner-que-es-creup'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(updateAboutPageContentSchema, body)
    let previousHeroImage: string | null = null

    const item = await db.transaction(async (tx) => {
      const existing = await tx.query.aboutPageContent.findFirst()
      previousHeroImage = existing?.heroImage ?? null
      const heroImage = !validated.heroImage
        ? null
        : validated.heroImage === ABOUT_HERO_DEFAULT_IMAGE
          ? ABOUT_HERO_DEFAULT_IMAGE
          : await finalizeAdminImage({
              storagePath: validated.heroImage,
              uploadDir: ABOUT_IMAGE_UPLOAD_DIR,
              publicPath: ABOUT_IMAGE_PUBLIC_PATH,
              slug: ABOUT_HERO_SLUG,
              publish: validated.heroVisible,
              fallbackBaseName: 'banner-que-es-creup',
              replaceStoragePath: previousHeroImage,
              protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
            })
      trackAdminAssetFinalization(cleanupTargets, {
        sourceStoragePath: validated.heroImage,
        storagePath: heroImage,
        allowedPublicPathPrefixes: [ABOUT_IMAGE_PUBLIC_PATH],
        protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
      })

      const [upserted] = await tx
        .insert(aboutPageContent)
        .values({
          id: 'singleton',
          heroImage,
          heroVisible: validated.heroVisible && Boolean(heroImage),
        })
        .onConflictDoUpdate({
          target: aboutPageContent.id,
          set: {
            heroImage,
            heroVisible: validated.heroVisible && Boolean(heroImage),
          },
        })
        .returning()

      if (!upserted) {
        throw createError({ statusCode: 500, message: 'No se pudo guardar el contenido' })
      }

      return upserted
    })

    if (
      previousHeroImage &&
      previousHeroImage !== ABOUT_HERO_DEFAULT_IMAGE &&
      item?.heroImage !== previousHeroImage
    ) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousHeroImage,
          allowedPublicPathPrefixes: [ABOUT_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
        },
        'admin.about.update.cleanup',
        event
      )
    }

    return { data: item, item }
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.about.update.rollback', event)
    throwAdminMutationError('admin.about.update', error, event)
  }
})
