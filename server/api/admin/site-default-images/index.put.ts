import { type H3Event, createError, defineEventHandler, readBody } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '../../../db'
import { siteDefaultImages } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/admin/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/admin/adminAssetPublication'
import { invalidateSiteDefaultImagesCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { assertOptimisticLock } from '../../../utils/admin/optimisticLock'
import { validateBody } from '../../../utils/validation'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
  SITE_DEFAULT_IMAGE_SLOT_DEFINITIONS,
  getSiteDefaultSlotDefinition,
} from '~~/shared/constants/siteDefaultImages'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import { updateSiteDefaultImagesSchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'

type SlotPayloadKey =
  | 'pressReleaseImage'
  | 'statementImage'
  | 'mediaAppearanceImage'
  | 'carouselSlideImage'
  | 'ogImage'
  | 'activityEntryImage'
  | 'areaReportImage'

const SLOT_PAYLOAD_MAP: Record<SlotPayloadKey, { scope: string; slot: string }> = {
  pressReleaseImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.press,
    slot: SITE_DEFAULT_IMAGE_SLOT.pressRelease,
  },
  statementImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.press,
    slot: SITE_DEFAULT_IMAGE_SLOT.statement,
  },
  mediaAppearanceImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.press,
    slot: SITE_DEFAULT_IMAGE_SLOT.mediaAppearance,
  },
  carouselSlideImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.carousel,
    slot: SITE_DEFAULT_IMAGE_SLOT.carouselSlide,
  },
  ogImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.seo,
    slot: SITE_DEFAULT_IMAGE_SLOT.ogImage,
  },
  activityEntryImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.activity,
    slot: SITE_DEFAULT_IMAGE_SLOT.activityEntry,
  },
  areaReportImage: {
    scope: SITE_DEFAULT_IMAGE_SCOPE.areaReport,
    slot: SITE_DEFAULT_IMAGE_SLOT.areaReport,
  },
}

const SLOT_KEY_BY_SCOPE_SLOT = new Map(
  Object.entries(SLOT_PAYLOAD_MAP).map(([key, value]) => [`${value.scope}\0${value.slot}`, key])
)

function getPayloadKeyForSlot(event: H3Event, scope: string, slot: string): SlotPayloadKey {
  const key = SLOT_KEY_BY_SCOPE_SLOT.get(`${scope}\0${slot}`)
  if (!key) {
    throw createError({
      statusCode: 500,
      message: getAdminApiErrorMessage(event, 'slotConfigInvalid'),
    })
  }
  return key as SlotPayloadKey
}

function allowedPrefixForSlot(scope: string, slot: string): string {
  const def = getSiteDefaultSlotDefinition(scope, slot)
  if (!def) {
    return PRESS_IMAGE_PUBLIC_BASE
  }
  if (def.scope === SITE_DEFAULT_IMAGE_SCOPE.press) {
    return PRESS_IMAGE_PUBLIC_BASE
  }
  return def.publicPath
}

async function finalizeDefaultSlot(options: {
  event: H3Event
  key: SlotPayloadKey
  incoming: string | null
  previous: string | null
  cleanupTargets: CleanupUnusedAdminAssetOptions[]
}): Promise<string | null> {
  const { event, key, incoming, previous, cleanupTargets } = options
  const { scope, slot } = SLOT_PAYLOAD_MAP[key]
  const def = getSiteDefaultSlotDefinition(scope, slot)
  if (!def) {
    throw createError({
      statusCode: 500,
      message: getAdminApiErrorMessage(event, 'slotConfigInvalid'),
    })
  }

  if (incoming === previous) {
    return previous
  }

  if (!incoming) {
    return null
  }

  const storagePath = await finalizeAdminImage({
    storagePath: incoming,
    uploadDir: def.uploadDir,
    publicPath: def.publicPath,
    slug: def.uniqueFilename ? undefined : def.finalizeSlug,
    publish: true,
    fallbackBaseName: def.finalizeSlug,
    replaceStoragePath: previous ?? undefined,
  })

  const allowedPrefix = allowedPrefixForSlot(scope, slot)

  trackAdminAssetFinalization(cleanupTargets, {
    sourceStoragePath: incoming,
    storagePath,
    allowedPublicPathPrefixes: [allowedPrefix],
  })

  return storagePath
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(event, updateSiteDefaultImagesSchema, body)

    const existingRows = await db.query.siteDefaultImages.findMany({
      columns: { scope: true, slot: true, image: true, updatedAt: true },
    })

    const prevMap = new Map<string, string | null>()
    for (const row of existingRows) {
      prevMap.set(`${row.scope}\0${row.slot}`, row.image)
    }

    const getPrev = (scope: string, slot: string) => prevMap.get(`${scope}\0${slot}`) ?? null

    const serverVersion =
      existingRows.length > 0
        ? new Date(Math.max(...existingRows.map((r) => r.updatedAt.getTime())))
        : null

    assertOptimisticLock(
      validated.updatedAt,
      serverVersion,
      getAdminApiErrorMessage(event, 'siteDefaultImagesOptimisticLock')
    )

    const nextPressRelease = await finalizeDefaultSlot({
      event,
      key: 'pressReleaseImage',
      incoming: validated.pressReleaseImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.press, SITE_DEFAULT_IMAGE_SLOT.pressRelease),
      cleanupTargets,
    })
    const nextStatement = await finalizeDefaultSlot({
      event,
      key: 'statementImage',
      incoming: validated.statementImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.press, SITE_DEFAULT_IMAGE_SLOT.statement),
      cleanupTargets,
    })
    const nextMedia = await finalizeDefaultSlot({
      event,
      key: 'mediaAppearanceImage',
      incoming: validated.mediaAppearanceImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.press, SITE_DEFAULT_IMAGE_SLOT.mediaAppearance),
      cleanupTargets,
    })
    const nextCarousel = await finalizeDefaultSlot({
      event,
      key: 'carouselSlideImage',
      incoming: validated.carouselSlideImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.carousel, SITE_DEFAULT_IMAGE_SLOT.carouselSlide),
      cleanupTargets,
    })
    const nextOgImage = await finalizeDefaultSlot({
      event,
      key: 'ogImage',
      incoming: validated.ogImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.seo, SITE_DEFAULT_IMAGE_SLOT.ogImage),
      cleanupTargets,
    })
    const nextActivityEntry = await finalizeDefaultSlot({
      event,
      key: 'activityEntryImage',
      incoming: validated.activityEntryImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.activity, SITE_DEFAULT_IMAGE_SLOT.activityEntry),
      cleanupTargets,
    })
    const nextAreaReport = await finalizeDefaultSlot({
      event,
      key: 'areaReportImage',
      incoming: validated.areaReportImage,
      previous: getPrev(SITE_DEFAULT_IMAGE_SCOPE.areaReport, SITE_DEFAULT_IMAGE_SLOT.areaReport),
      cleanupTargets,
    })

    const nextByKey: Record<SlotPayloadKey, string | null> = {
      pressReleaseImage: nextPressRelease,
      statementImage: nextStatement,
      mediaAppearanceImage: nextMedia,
      carouselSlideImage: nextCarousel,
      ogImage: nextOgImage,
      activityEntryImage: nextActivityEntry,
      areaReportImage: nextAreaReport,
    }

    await db.transaction(async (tx) => {
      for (const def of SITE_DEFAULT_IMAGE_SLOT_DEFINITIONS) {
        const key = getPayloadKeyForSlot(event, def.scope, def.slot)
        const image = nextByKey[key]

        await tx
          .insert(siteDefaultImages)
          .values({
            scope: def.scope,
            slot: def.slot,
            image,
          })
          .onConflictDoUpdate({
            target: [siteDefaultImages.scope, siteDefaultImages.slot],
            set: {
              image: sql`excluded.image`,
              updatedAt: sql`now()`,
            },
          })
      }
    })

    for (const def of SITE_DEFAULT_IMAGE_SLOT_DEFINITIONS) {
      const key = getPayloadKeyForSlot(event, def.scope, def.slot)
      const previous = getPrev(def.scope, def.slot)
      const next = nextByKey[key]
      if (previous && previous !== next) {
        await cleanupUnusedAdminAssetSafely(
          {
            storagePath: previous,
            allowedPublicPathPrefixes: [allowedPrefixForSlot(def.scope, def.slot)],
          },
          'admin.site-default-images.update.cleanup',
          event
        )
      }
    }

    await invalidateSiteDefaultImagesCaches()

    const rows = await db.query.siteDefaultImages.findMany({ columns: { updatedAt: true } })
    const updatedAt =
      rows.length > 0
        ? new Date(Math.max(...rows.map((r) => r.updatedAt.getTime()))).toISOString()
        : null

    return {
      data: {
        pressReleaseImage: nextPressRelease,
        statementImage: nextStatement,
        mediaAppearanceImage: nextMedia,
        carouselSlideImage: nextCarousel,
        ogImage: nextOgImage,
        activityEntryImage: nextActivityEntry,
        areaReportImage: nextAreaReport,
        updatedAt,
      },
    }
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.site-default-images.update.rollback',
      event
    )
    throwAdminMutationError('admin.site-default-images.update', error, event)
  }
})
