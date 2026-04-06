import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { aboutPageContent } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import { updateAboutPageContentSchema, validateBody } from '../../../utils/validation'
import { ABOUT_HERO_DEFAULT_IMAGE, ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const ABOUT_IMAGE_UPLOAD_DIR = 'public/conocenos/imagenes'
const ABOUT_HERO_SLUG = 'banner-que-es-creup'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const item = await db.query.aboutPageContent.findFirst()

    return { item }
  }

  if (event.method === 'PUT') {
    const body = await readBody(event)

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

        if (!existing) {
          const [created] = await tx
            .insert(aboutPageContent)
            .values({
              heroImage,
              heroVisible: validated.heroVisible && Boolean(heroImage),
            })
            .returning()

          if (!created) {
            throw createError({ statusCode: 500, message: 'No se pudo guardar el contenido' })
          }

          return created
        }

        await tx
          .update(aboutPageContent)
          .set({
            heroImage,
            heroVisible: validated.heroVisible && Boolean(heroImage),
          })
          .where(eq(aboutPageContent.id, existing.id))

        return tx.query.aboutPageContent.findFirst({
          where: eq(aboutPageContent.id, existing.id),
        })
      })

      if (
        previousHeroImage &&
        previousHeroImage !== ABOUT_HERO_DEFAULT_IMAGE &&
        item?.heroImage !== previousHeroImage
      ) {
        await cleanupUnusedAdminAsset({
          storagePath: previousHeroImage,
          allowedPublicPathPrefixes: [ABOUT_IMAGE_PUBLIC_PATH],
          protectedPublicPaths: [ABOUT_HERO_DEFAULT_IMAGE],
        })
      }

      return { item }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
