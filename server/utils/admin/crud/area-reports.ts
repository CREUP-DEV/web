import { createError } from 'h3'
import type { H3Event } from 'h3'
import { and, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '../../../db'
import { areaReportEditions, areaReports, areaReportTranslations } from '../../../db/schema'
import { finalizeAdminImage } from '../adminImageUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../adminAssetPublication'
import { isExclusionConstraintViolation, throwAdminMutationError } from '../adminErrors'
import { assertOptimisticLock, buildOptimisticLockCondition } from '../optimisticLock'
import { lockAreaCatalogEntry } from '../activitySnapshots'
import { getAdminApiErrorMessage } from '../../locale/adminApiErrorMessages'
import { sanitizeRichTextHtml } from '../../press/pressTranslation'
import { AREA_REPORTS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { createAreaReportSchema, updateAreaReportSchema } from '../../validation'

const IMAGE_UPLOAD_DIR = 'public/transparencia/informes-areas/imagenes'

type AreaReportData = z.infer<typeof createAreaReportSchema>
type UpdateAreaReportData = z.infer<typeof updateAreaReportSchema>
type AreaReportTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type AreaReportQueryItem = NonNullable<Awaited<ReturnType<typeof refetch>>>

function imageSlug(monthKey: string, areaId: number) {
  return `informe-${monthKey}-area-${areaId}`
}

/**
 * Upsert the edition row that owns a month's reports. The covered range is a property of the
 * edition, shared by all its areas (plan §6), and the per-area form is the only place it is edited.
 *
 * `authoritative` distinguishes the two callers so the same field is both clearable and safe:
 *  - create (`authoritative = false`): a null incoming `coversFrom` must NOT wipe a range an
 *    existing edition already has (a new sibling area is being added to, e.g., a Jan–Feb edition
 *    without re-stating the range), so null is coalesced to the stored value.
 *  - update (`authoritative = true`): the edit form always carries the edition's current range, so
 *    the submitted value is the intent — a null means "clear the range" and must set it to null.
 *
 * Overlap is enforced by the EXCLUDE constraint (→ 23P01 → 409).
 */
async function upsertEdition(
  tx: AreaReportTx,
  monthKey: string,
  coversFrom: string | null,
  authoritative: boolean
) {
  await tx
    .insert(areaReportEditions)
    .values({ monthKey, coversFrom })
    .onConflictDoUpdate({
      target: areaReportEditions.monthKey,
      set: {
        coversFrom: authoritative
          ? coversFrom
          : sql`coalesce(excluded.covers_from, ${areaReportEditions.coversFrom})`,
      },
    })
}

/** Delete an edition once its last report has gone, so the month selector never lists empty months. */
async function cleanupOrphanEdition(tx: AreaReportTx, monthKey: string) {
  const [remaining] = await tx
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(areaReports)
    .where(eq(areaReports.monthKey, monthKey))
  if ((remaining?.count ?? 0) === 0) {
    await tx.delete(areaReportEditions).where(eq(areaReportEditions.monthKey, monthKey))
  }
}

function buildTranslationValues(
  translations: AreaReportData['translations'],
  areaReportId: string
) {
  // content_html is NOT NULL, so only persist locales whose content actually survives sanitisation;
  // the rest fall back to the required Spanish translation at render time. Sanitising once (rather
  // than gating on hasMeaningfulRichTextHtml and casting) guarantees the stored value is non-null.
  return translations
    .map((translation) => ({
      locale: translation.locale,
      contentHtml: sanitizeRichTextHtml(translation.contentHtml),
      imageCaption: translation.imageCaption?.trim() || null,
      alt: translation.alt?.trim() || null,
      areaReportId,
    }))
    .filter((row): row is typeof row & { contentHtml: string } => row.contentHtml !== null)
}

function refetch(executor: AreaReportTx | typeof db, id: string) {
  return executor.query.areaReports.findFirst({
    where: eq(areaReports.id, id),
    with: { translations: true, edition: true },
  })
}

function formatItem(item: AreaReportQueryItem | null) {
  if (!item) return null
  return {
    ...item,
    translations: item.translations.map((translation) => ({
      ...translation,
      contentHtml: sanitizeRichTextHtml(translation.contentHtml),
    })),
  }
}

export async function createAreaReport(data: AreaReportData, event: H3Event) {
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []
  let image: string | null = null

  try {
    const result = await db.transaction(async (tx) => {
      // Reading the area under a shared lock is what keeps the frozen snapshot honest: the catalog
      // sync deletes areas the org chart no longer lists, and takes `FOR UPDATE` to do it, so the
      // two meet here instead of racing.
      const areaSnapshot = await lockAreaCatalogEntry(tx, data.areaId)
      if (!areaSnapshot) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'areaReportAreaMissing'),
        })
      }

      // Overlap check (EXCLUDE constraint → 23P01) happens here, before any asset is moved.
      // Create never clears a sibling's range (authoritative = false).
      await upsertEdition(tx, data.monthKey, data.coversFrom ?? null, false)

      if (data.image) {
        image = await finalizeAdminImage({
          storagePath: data.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: AREA_REPORTS_IMAGE_PUBLIC_BASE,
          slug: imageSlug(data.monthKey, data.areaId),
          publish: data.active,
          fallbackBaseName: 'informe-area',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: data.image,
          storagePath: image,
          allowedPublicPathPrefixes: [AREA_REPORTS_IMAGE_PUBLIC_BASE],
        })
      }

      const [row] = await tx
        .insert(areaReports)
        .values({
          monthKey: data.monthKey,
          areaId: data.areaId,
          areaNameSnapshot: areaSnapshot.areaNameSnapshot,
          areaOrderSnapshot: areaSnapshot.areaOrderSnapshot,
          image: image ?? null,
          active: data.active,
        })
        .returning({ id: areaReports.id })

      if (!row) {
        throw createError({
          statusCode: 500,
          message: getAdminApiErrorMessage(event, 'areaReportSaveFailed'),
        })
      }

      const translationRows = buildTranslationValues(data.translations, row.id)
      if (translationRows.length > 0) {
        await tx.insert(areaReportTranslations).values(translationRows)
      }

      return (await refetch(tx, row.id)) as AreaReportQueryItem | null
    })

    if (data.image && data.image !== image) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: data.image, allowedPublicPathPrefixes: [AREA_REPORTS_IMAGE_PUBLIC_BASE] },
        'admin.area-reports.create.cleanup.image',
        event
      )
    }

    return formatItem(result ?? null)
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.area-reports.create.rollback',
      event
    )
    if (isExclusionConstraintViolation(error)) {
      throw createError({
        statusCode: 409,
        message: getAdminApiErrorMessage(event, 'areaReportOverlap'),
      })
    }
    throwAdminMutationError('admin.area-reports.create', error, event)
  }
}

export async function updateAreaReport(id: string, data: UpdateAreaReportData, event: H3Event) {
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []
  let image: string | null = null
  let previousImage: string | null = null

  try {
    const existing = await db.query.areaReports.findFirst({ where: eq(areaReports.id, id) })
    if (!existing) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    assertOptimisticLock(
      data.updatedAt,
      existing.updatedAt,
      getAdminApiErrorMessage(event, 'areaReportOptimisticLock')
    )

    // The area is fixed at creation: its name/order snapshot is frozen and never re-resolved on
    // edit, so a later org-chart change (or a now-removed area) can never alter or block an edit.
    previousImage = existing.image
    const monthKeyChanged = existing.monthKey !== data.monthKey

    const result = await db.transaction(async (tx) => {
      // Editing in place: the form carries this edition's current range, so the submitted value is
      // authoritative — a null clears it (lets an edition go back from multi-month to single month).
      // When the report is moved to another month, treat the target edition's range as protected
      // (authoritative = false) so the move never clobbers a range the target edition already has.
      await upsertEdition(tx, data.monthKey, data.coversFrom ?? null, !monthKeyChanged)

      if (data.image) {
        image = await finalizeAdminImage({
          storagePath: data.image,
          uploadDir: IMAGE_UPLOAD_DIR,
          publicPath: AREA_REPORTS_IMAGE_PUBLIC_BASE,
          slug: imageSlug(data.monthKey, existing.areaId),
          publish: data.active,
          fallbackBaseName: 'informe-area',
          replaceStoragePath: existing.image ?? undefined,
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: data.image,
          storagePath: image,
          allowedPublicPathPrefixes: [AREA_REPORTS_IMAGE_PUBLIC_BASE],
        })
      }

      const optimisticLockCondition = data.updatedAt
        ? buildOptimisticLockCondition(areaReports.updatedAt, data.updatedAt)
        : eq(areaReports.updatedAt, existing.updatedAt)

      const updatedRows = await tx
        .update(areaReports)
        .set({
          monthKey: data.monthKey,
          image: image ?? null,
          active: data.active,
        })
        .where(and(eq(areaReports.id, id), optimisticLockCondition))
        .returning({ id: areaReports.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'areaReportOptimisticLock'),
        })
      }

      const translationRows = buildTranslationValues(data.translations, id)
      await tx.delete(areaReportTranslations).where(eq(areaReportTranslations.areaReportId, id))
      if (translationRows.length > 0) {
        await tx.insert(areaReportTranslations).values(translationRows)
      }

      // After moving the row to another month, the origin edition may be empty.
      if (monthKeyChanged) {
        await cleanupOrphanEdition(tx, existing.monthKey)
      }

      return (await refetch(tx, id)) as AreaReportQueryItem | null
    })

    if (previousImage && previousImage !== image) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: previousImage, allowedPublicPathPrefixes: [AREA_REPORTS_IMAGE_PUBLIC_BASE] },
        'admin.area-reports.update.cleanup.image',
        event
      )
    }

    return formatItem(result ?? null)
  } catch (error) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.area-reports.update.rollback',
      event
    )
    if (isExclusionConstraintViolation(error)) {
      throw createError({
        statusCode: 409,
        message: getAdminApiErrorMessage(event, 'areaReportOverlap'),
      })
    }
    throwAdminMutationError('admin.area-reports.update', error, event)
  }
}

export async function deleteAreaReport(id: string, event: H3Event) {
  try {
    const existing = await db.query.areaReports.findFirst({ where: eq(areaReports.id, id) })
    if (!existing) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    await db.transaction(async (tx) => {
      await tx.delete(areaReports).where(eq(areaReports.id, id))
      await cleanupOrphanEdition(tx, existing.monthKey)
    })

    await cleanupUnusedAdminAssetSafely(
      { storagePath: existing.image, allowedPublicPathPrefixes: [AREA_REPORTS_IMAGE_PUBLIC_BASE] },
      'admin.area-reports.delete.cleanup.image',
      event
    )

    return { success: true }
  } catch (error) {
    throwAdminMutationError('admin.area-reports.delete', error, event)
  }
}
