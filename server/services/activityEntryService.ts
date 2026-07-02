import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, eq, isNull, notInArray, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '../db'
import { activityEntries, activityEntryTranslations } from '../db/schema'
import type { MemberOrgSnapshot, MemberOrgSource } from '../db/schema/activity'
import { finalizeAdminImage } from '../utils/admin/adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../utils/admin/adminAssetPublication'
import { isUniqueConstraintViolation, throwAdminMutationError } from '../utils/admin/adminErrors'
import { assertOptimisticLock, buildOptimisticLockCondition } from '../utils/admin/optimisticLock'
import { resolveMemberOrgSnapshot } from '../utils/admin/activitySnapshots'
import { getRequiredTranslationValue } from '../utils/locale/localizedContent'
import { getAdminApiErrorMessage } from '../utils/locale/adminApiErrorMessages'
import { sanitizeActivityTranslations } from '../utils/activity/activityTranslation'
import { hasMeaningfulRichTextHtml, sanitizeRichTextHtml } from '../utils/press/pressTranslation'
import { generateActivitySlug } from '../utils/core/slug'
import { dateOnlyToStorageDate } from '~~/shared/utils/date'
import { SUPPORTED_LOCALE_CODES, type SupportedLocaleCode } from '~~/shared/utils/locale'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { createActivityEntrySchema, updateActivityEntrySchema } from '../utils/validation'

const IMAGE_UPLOAD_DIR = 'public/transparencia/actividad/imagenes'

type ActivityEntryData = z.infer<typeof createActivityEntrySchema>
type UpdateActivityEntryData = z.infer<typeof updateActivityEntrySchema>
type ActivityEntryTranslationRow = {
  locale: SupportedLocaleCode
  title: string
  excerpt: string | null
  contentHtml: string | null
  imageCaption: string | null
  alt: string | null
}
type ActivityEntryQueryItem = NonNullable<
  Awaited<ReturnType<typeof db.query.activityEntries.findFirst>>
> & {
  translations: ActivityEntryTranslationRow[]
}

function randomSlugSuffix(): string {
  return Math.random().toString(16).slice(2, 6)
}

function isSlugUniqueConstraintViolation(error: unknown): boolean {
  if (!isUniqueConstraintViolation(error)) return false
  const e = error as { constraint?: string; detail?: string }
  if (e.constraint) return e.constraint.toLowerCase().includes('slug')
  if (e.detail) return e.detail.toLowerCase().includes('slug')
  return true
}

interface ResolvedMemberFields {
  memberOrgSource: MemberOrgSource | null
  memberOrgId: string | null
  memberOrgSnapshot: MemberOrgSnapshot | null
}

/**
 * Resolve the organiser fields for the row (plan §3.2/§5.4):
 * - CREUP entries carry no organiser.
 * - Member entries freeze a fresh snapshot on create, when the reference changes, or when the
 *   "Actualizar datos desde el organigrama" button sets `refreshSnapshot`; otherwise the stored
 *   snapshot is preserved so editing other fields never rewrites organiser history.
 */
async function resolveMemberFields(
  event: H3Event,
  data: ActivityEntryData | UpdateActivityEntryData,
  existing?: Pick<
    ActivityEntryQueryItem,
    'kind' | 'memberOrgSource' | 'memberOrgId' | 'memberOrgSnapshot'
  >
): Promise<ResolvedMemberFields> {
  if (data.kind !== 'member') {
    return { memberOrgSource: null, memberOrgId: null, memberOrgSnapshot: null }
  }

  // refine() guarantees these are present for member entries.
  const source = data.memberOrgSource as MemberOrgSource
  const id = data.memberOrgId as string

  const referenceChanged =
    !existing ||
    existing.kind !== 'member' ||
    existing.memberOrgSource !== source ||
    existing.memberOrgId !== id
  const forceRefresh = 'refreshSnapshot' in data && data.refreshSnapshot === true

  if (existing && !referenceChanged && !forceRefresh && existing.memberOrgSnapshot) {
    return {
      memberOrgSource: source,
      memberOrgId: id,
      memberOrgSnapshot: existing.memberOrgSnapshot,
    }
  }

  const resolved = await resolveMemberOrgSnapshot(event, source, id)
  if (!resolved) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'activityMemberOrgMissing'),
    })
  }
  return resolved
}

function buildTranslationValues(
  translations: ActivityEntryData['translations'],
  activityEntryId: string
) {
  return translations.map((translation) => ({
    locale: translation.locale,
    title: translation.title.trim(),
    excerpt: translation.excerpt?.trim() || null,
    contentHtml: hasMeaningfulRichTextHtml(translation.contentHtml)
      ? sanitizeRichTextHtml(translation.contentHtml)
      : null,
    imageCaption: translation.imageCaption?.trim() || null,
    alt: translation.alt?.trim() || null,
    activityEntryId,
  }))
}

function formatItem(item: ActivityEntryQueryItem | null) {
  if (!item) return null
  return {
    ...item,
    translations: sanitizeActivityTranslations(item.translations).filter(
      (translation): translation is typeof translation & { locale: SupportedLocaleCode } =>
        (SUPPORTED_LOCALE_CODES as readonly string[]).includes(translation.locale)
    ),
  }
}

export async function createActivityEntry(data: ActivityEntryData, event: H3Event) {
  let image: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  async function runTransaction(
    defaultTitle: string,
    startDateValue: string,
    startDateAnchor: Date,
    memberFields: ResolvedMemberFields,
    opts: { forcedSlugSuffix?: string; imageSource?: string | null }
  ) {
    return db.transaction(async (tx) => {
      const slug = await generateActivitySlug(defaultTitle, startDateAnchor, {
        executor: tx,
        forcedSuffix: opts.forcedSlugSuffix,
      })

      const effectiveImageSource = opts.imageSource !== undefined ? opts.imageSource : data.image

      if (effectiveImageSource) {
        image = await finalizeAdminImage({
          storagePath: effectiveImageSource,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: ACTIVITY_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'actividad',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: effectiveImageSource,
          storagePath: image,
          allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE],
        })
      }

      const [item] = await tx
        .insert(activityEntries)
        .values({
          kind: data.kind,
          slug,
          image: image ?? null,
          startDate: startDateValue,
          endDate: data.endDate ?? null,
          isOnline: data.isOnline,
          location: data.isOnline ? null : (data.location ?? null),
          memberOrgSource: memberFields.memberOrgSource,
          memberOrgId: memberFields.memberOrgId,
          memberOrgSnapshot: memberFields.memberOrgSnapshot,
          active: data.active,
        })
        .returning()

      if (!item) {
        throw createError({
          statusCode: 500,
          message: getAdminApiErrorMessage(event, 'activityCreateFailed'),
        })
      }

      if (data.translations.length > 0) {
        await tx
          .insert(activityEntryTranslations)
          .values(buildTranslationValues(data.translations, item.id))
      }

      return (await tx.query.activityEntries.findFirst({
        where: eq(activityEntries.id, item.id),
        with: { translations: true },
      })) as ActivityEntryQueryItem | null
    })
  }

  try {
    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const startDateValue = data.startDate
    const startDateAnchor = dateOnlyToStorageDate(startDateValue)
    const memberFields = await resolveMemberFields(event, data)

    let completeItem: ActivityEntryQueryItem | null
    try {
      completeItem = await runTransaction(
        defaultTitle,
        startDateValue,
        startDateAnchor,
        memberFields,
        {}
      )
    } catch (firstError) {
      if (!isSlugUniqueConstraintViolation(firstError)) throw firstError

      const firstImage = image
      image = null
      cleanupTargets.splice(0)

      completeItem = await runTransaction(
        defaultTitle,
        startDateValue,
        startDateAnchor,
        memberFields,
        { forcedSlugSuffix: randomSlugSuffix(), imageSource: firstImage ?? undefined }
      ).catch(() => {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'activitySlugFailed'),
        })
      })
    }

    if (data.image && data.image !== image) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: data.image, allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE] },
        'admin.activity.create.cleanup.image',
        event
      )
    }

    return formatItem(completeItem ?? null)
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.activity.create.rollback',
      event
    )
    throwAdminMutationError('admin.activity.create', error, event)
  }
}

export async function updateActivityEntry(
  id: string,
  data: UpdateActivityEntryData,
  event: H3Event
) {
  let previousImage: string | null = null
  let image: string | null = null
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  async function runTransaction(
    existingItem: ActivityEntryQueryItem,
    defaultTitle: string,
    startDateValue: string,
    startDateAnchor: Date,
    memberFields: ResolvedMemberFields,
    opts: { forcedSlugSuffix?: string; imageSource?: string | null }
  ) {
    return db.transaction(async (tx) => {
      const slug = await generateActivitySlug(defaultTitle, startDateAnchor, {
        excludeId: id,
        executor: tx,
        forcedSuffix: opts.forcedSlugSuffix,
      })

      const effectiveImageSource = opts.imageSource !== undefined ? opts.imageSource : data.image

      if (effectiveImageSource) {
        image = await finalizeAdminImage({
          storagePath: effectiveImageSource,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: ACTIVITY_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'actividad',
          replaceStoragePath: existingItem.image ?? undefined,
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: effectiveImageSource,
          storagePath: image,
          allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE],
        })
      }

      const optimisticLockCondition = data.updatedAt
        ? buildOptimisticLockCondition(activityEntries.updatedAt, data.updatedAt)
        : existingItem.updatedAt
          ? eq(activityEntries.updatedAt, existingItem.updatedAt)
          : isNull(activityEntries.updatedAt)

      const updatedRows = await tx
        .update(activityEntries)
        .set({
          kind: data.kind,
          slug,
          image: image ?? null,
          startDate: startDateValue,
          endDate: data.endDate ?? null,
          isOnline: data.isOnline,
          location: data.isOnline ? null : (data.location ?? null),
          memberOrgSource: memberFields.memberOrgSource,
          memberOrgId: memberFields.memberOrgId,
          memberOrgSnapshot: memberFields.memberOrgSnapshot,
          active: data.active,
        })
        .where(and(eq(activityEntries.id, id), optimisticLockCondition))
        .returning({ id: activityEntries.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'activityOptimisticLock'),
        })
      }

      const newLocales = data.translations.map((translation) => translation.locale)
      if (newLocales.length > 0) {
        await tx
          .delete(activityEntryTranslations)
          .where(
            and(
              eq(activityEntryTranslations.activityEntryId, id),
              notInArray(activityEntryTranslations.locale, newLocales)
            )
          )

        await tx
          .insert(activityEntryTranslations)
          .values(buildTranslationValues(data.translations, id))
          .onConflictDoUpdate({
            target: [activityEntryTranslations.locale, activityEntryTranslations.activityEntryId],
            set: {
              title: sql`excluded.title`,
              excerpt: sql`excluded.excerpt`,
              contentHtml: sql`excluded.content_html`,
              imageCaption: sql`excluded.image_caption`,
              alt: sql`excluded.alt`,
            },
          })
      } else {
        await tx
          .delete(activityEntryTranslations)
          .where(eq(activityEntryTranslations.activityEntryId, id))
      }

      return (await tx.query.activityEntries.findFirst({
        where: eq(activityEntries.id, id),
        with: { translations: true },
      })) as ActivityEntryQueryItem | null
    })
  }

  try {
    const existingItem = (await db.query.activityEntries.findFirst({
      where: eq(activityEntries.id, id),
      with: { translations: true },
    })) as ActivityEntryQueryItem | undefined

    if (!existingItem) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    assertOptimisticLock(
      data.updatedAt,
      existingItem.updatedAt,
      getAdminApiErrorMessage(event, 'activityOptimisticLock')
    )

    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const startDateValue = data.startDate
    const startDateAnchor = dateOnlyToStorageDate(startDateValue)
    const memberFields = await resolveMemberFields(event, data, existingItem)
    previousImage = existingItem.image

    let item: ActivityEntryQueryItem | null
    try {
      item = await runTransaction(
        existingItem,
        defaultTitle,
        startDateValue,
        startDateAnchor,
        memberFields,
        {}
      )
    } catch (firstError) {
      if (!isSlugUniqueConstraintViolation(firstError)) throw firstError

      const firstImage = image
      image = null
      cleanupTargets.splice(0)

      item = await runTransaction(
        existingItem,
        defaultTitle,
        startDateValue,
        startDateAnchor,
        memberFields,
        { forcedSlugSuffix: randomSlugSuffix(), imageSource: firstImage ?? undefined }
      ).catch(() => {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'activitySlugFailed'),
        })
      })
    }

    if (previousImage !== image) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: previousImage, allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE] },
        'admin.activity.update.cleanup.image',
        event
      )
    }

    return formatItem(item ?? null)
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.activity.update.rollback',
      event
    )
    throwAdminMutationError('admin.activity.update', error, event)
  }
}
