import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, desc, eq, notInArray, sql } from 'drizzle-orm'
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
import { throwAdminMutationError } from '../utils/admin/adminErrors'
import { throwPossibleDuplicate } from '../utils/admin/possibleDuplicate'
import { assertOptimisticLock, buildExpectedVersionCondition } from '../utils/admin/optimisticLock'
import { lockMemberOrgCatalogEntry } from '../utils/admin/activitySnapshots'
import { getRequiredTranslationValue } from '../utils/locale/localizedContent'
import { getAdminApiErrorMessage } from '../utils/locale/adminApiErrorMessages'
import { sanitizeActivityTranslations } from '../utils/activity/activityTranslation'
import { hasMeaningfulRichTextHtml, sanitizeRichTextHtml } from '../utils/press/pressTranslation'
import {
  buildActivityBaseSlug,
  buildSlugFamilyPattern,
  generateActivitySlug,
  recordActivitySlugChange,
} from '../utils/core/slug'
import { dateOnlyToStorageDate } from '~~/shared/utils/date'
import {
  DEFAULT_LOCALE_CODE,
  SUPPORTED_LOCALE_CODES,
  type SupportedLocaleCode,
} from '~~/shared/utils/locale'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { createActivityEntrySchema, updateActivityEntrySchema } from '../utils/validation'

const IMAGE_UPLOAD_DIR = 'public/prensa/actividad/imagenes'

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

interface ResolvedMemberFields {
  memberOrgSource: MemberOrgSource | null
  memberOrgId: string | null
  memberOrgSnapshot: MemberOrgSnapshot | null
}

interface MemberFieldsPlan extends Omit<ResolvedMemberFields, 'memberOrgSnapshot'> {
  /** The snapshot to keep verbatim; `null` means "freeze a fresh one from the catalog row". */
  keptSnapshot: MemberOrgSnapshot | null
}

/**
 * Decide the organiser fields for the row (plan §3.2/§5.4):
 * - CREUP entries carry no organiser.
 * - Member entries freeze a fresh snapshot on create, when the reference changes, or when the
 *   "Actualizar datos desde el organigrama" button sets `refreshSnapshot`; otherwise the stored
 *   snapshot is preserved so editing other fields never rewrites organiser history.
 *
 * Pure: reading the catalog is `resolveMemberFields`'s job, because it has to happen under a lock.
 */
function planMemberFields(
  data: ActivityEntryData | UpdateActivityEntryData,
  existing?: Pick<
    ActivityEntryQueryItem,
    'kind' | 'memberOrgSource' | 'memberOrgId' | 'memberOrgSnapshot'
  >
): MemberFieldsPlan {
  if (data.kind !== 'member') {
    return { memberOrgSource: null, memberOrgId: null, keptSnapshot: null }
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
  const keepExisting = Boolean(existing && !referenceChanged && !forceRefresh)

  return {
    memberOrgSource: source,
    memberOrgId: id,
    keptSnapshot: keepExisting ? (existing?.memberOrgSnapshot ?? null) : null,
  }
}

/**
 * Turn the plan into the values written to the row, holding the organiser's catalog entry for the
 * rest of the caller's transaction.
 *
 * The lock is taken even when the stored snapshot is preserved: that path writes no new organiser
 * data, but it still leaves a row referencing the catalog entry, so a delete running alongside must
 * either wait for it or find it already there.
 */
async function resolveMemberFields(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  plan: MemberFieldsPlan,
  event: H3Event
): Promise<ResolvedMemberFields> {
  if (!plan.memberOrgSource || !plan.memberOrgId) {
    return { memberOrgSource: null, memberOrgId: null, memberOrgSnapshot: null }
  }

  const locked = await lockMemberOrgCatalogEntry(tx, plan.memberOrgSource, plan.memberOrgId)
  if (!locked) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'activityMemberOrgMissing'),
    })
  }

  return {
    memberOrgSource: plan.memberOrgSource,
    memberOrgId: plan.memberOrgId,
    memberOrgSnapshot: plan.keptSnapshot ?? locked,
  }
}

/**
 * Refuse a create whose title and month match an existing entry — its slug would come out as
 * `<base>-N` — unless the editor confirmed it. Must run after `generateActivitySlug` in the same
 * transaction: the base slug's advisory lock is what makes the check race-free.
 */
async function assertNoActivityEntryDuplicate(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  baseSlug: string,
  event: H3Event
) {
  const [duplicate] = await tx
    .select({
      id: activityEntries.id,
      slug: activityEntries.slug,
      startDate: activityEntries.startDate,
      title: activityEntryTranslations.title,
    })
    .from(activityEntries)
    .leftJoin(
      activityEntryTranslations,
      and(
        eq(activityEntryTranslations.activityEntryId, activityEntries.id),
        eq(activityEntryTranslations.locale, DEFAULT_LOCALE_CODE)
      )
    )
    .where(sql`${activityEntries.slug} ~ ${buildSlugFamilyPattern(baseSlug)}`)
    .orderBy(desc(activityEntries.createdAt))
    .limit(1)

  if (duplicate) {
    throwPossibleDuplicate(event, {
      id: duplicate.id,
      title: duplicate.title ?? duplicate.slug,
      startDate: duplicate.startDate,
    })
  }
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

  try {
    const defaultTitle = getRequiredTranslationValue(data.translations, 'title')
    if (!defaultTitle) throw new Error('El título en español es obligatorio')

    const startDateValue = data.startDate
    const startDateAnchor = dateOnlyToStorageDate(startDateValue)
    const memberPlan = planMemberFields(data)

    const completeItem = await db.transaction(async (tx) => {
      const slug = await generateActivitySlug(defaultTitle, startDateAnchor, { executor: tx })

      // Before any asset moves: a refused create leaves the upload where the resend expects it.
      if (!data.confirmDuplicate) {
        await assertNoActivityEntryDuplicate(
          tx,
          buildActivityBaseSlug(defaultTitle, startDateAnchor),
          event
        )
      }

      const memberFields = await resolveMemberFields(tx, memberPlan, event)

      if (data.image) {
        image = await finalizeAdminImage({
          storagePath: data.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: ACTIVITY_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'actividad',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: data.image,
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
    const memberPlan = planMemberFields(data, existingItem)
    previousImage = existingItem.image

    const item = await db.transaction(async (tx) => {
      const slug = await generateActivitySlug(defaultTitle, startDateAnchor, {
        excludeId: id,
        executor: tx,
      })

      const memberFields = await resolveMemberFields(tx, memberPlan, event)

      if (data.image) {
        image = await finalizeAdminImage({
          storagePath: data.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: ACTIVITY_IMAGE_PUBLIC_BASE,
          slug,
          publish: data.active,
          fallbackBaseName: 'actividad',
          replaceStoragePath: existingItem.image ?? undefined,
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: data.image,
          storagePath: image,
          allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE],
        })
      }

      const optimisticLockCondition = buildExpectedVersionCondition(
        activityEntries.updatedAt,
        data.updatedAt,
        existingItem.updatedAt
      )

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

      // The optimistic lock above guarantees the row still carried `existingItem.slug`.
      await recordActivitySlugChange(tx, id, existingItem.slug, slug)

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
