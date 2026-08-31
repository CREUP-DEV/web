import { createError, defineEventHandler, readBody } from 'h3'
import { and, eq, sql } from 'drizzle-orm'
import { memberOrgCatalogEntries } from '../../../db/schema'
import {
  assertOptimisticLock,
  buildOptimisticLockCondition,
} from '../../../utils/admin/optimisticLock'
import { runAdminCrudTransaction } from '../../../utils/admin/adminCrud'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { updateMemberOrgCatalogEntrySchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { finalizeAdminImage } from '../../../utils/admin/adminImageUpload'
import {
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
  type CleanupUnusedAdminAssetOptions,
} from '../../../utils/admin/adminAssetPublication'
import { MEMBER_ORG_LOGOS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const LOGO_UPLOAD_DIR = 'public/transparencia/actividad/imagenes/organizaciones'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []
  const replacedLogos: string[] = []

  try {
    const validated = validateBody(event, updateMemberOrgCatalogEntrySchema, body)

    const item = await runAdminCrudTransaction(async (tx) => {
      const existingItem = await tx.query.memberOrgCatalogEntries.findFirst({
        where: eq(memberOrgCatalogEntries.id, id),
      })

      if (!existingItem) {
        throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
      }

      assertOptimisticLock(
        validated.updatedAt,
        existingItem.updatedAt,
        getAdminApiErrorMessage(event, 'memberOrgCatalogEntryOptimisticLock')
      )

      // `source` is part of this row's identity (selectionKey/sourceKey uniqueness is scoped by
      // it) — immutable after creation, never taken from the update payload.
      let supersededByEntryId = existingItem.supersededByEntryId
      if (validated.supersededByEntryId !== undefined) {
        if (validated.supersededByEntryId === null) {
          supersededByEntryId = null
        } else if (validated.supersededByEntryId === id) {
          throw createError({
            statusCode: 400,
            message: getAdminApiErrorMessage(event, 'memberOrgCatalogSupersedeSelfReference'),
          })
        } else {
          const target = await tx.query.memberOrgCatalogEntries.findFirst({
            where: eq(memberOrgCatalogEntries.id, validated.supersededByEntryId),
          })
          if (!target) {
            throw createError({
              statusCode: 404,
              message: getAdminApiErrorMessage(event, 'notFound'),
            })
          }
          if (target.source !== existingItem.source) {
            throw createError({
              statusCode: 400,
              message: getAdminApiErrorMessage(event, 'memberOrgCatalogSupersedeSourceMismatch'),
            })
          }
          supersededByEntryId = target.id
        }
      }

      // A superseded row is always historical, regardless of what the client sent for `active` —
      // otherwise it stays invisible to the client's own active-group filter while still counting
      // toward the server's active-only reorder scope, breaking every reorder for that source
      // group. It also keeps a superseded row out of another row's own supersede-candidate list.
      const active = supersededByEntryId !== null ? false : validated.active

      // Reactivating a historical row appends it to the end of its source group's active order.
      let nextOrder = validated.order
      if (active && !existingItem.active) {
        const [row] = await tx
          .select({
            maxOrder: sql<number>`coalesce(max(${memberOrgCatalogEntries.order}), -1)`.mapWith(
              Number
            ),
          })
          .from(memberOrgCatalogEntries)
          .where(
            and(
              eq(memberOrgCatalogEntries.source, existingItem.source),
              eq(memberOrgCatalogEntries.active, true)
            )
          )
        nextOrder = (row?.maxOrder ?? -1) + 1
      }

      // A freshly uploaded logo arrives as a temporary path and has to be moved into the public
      // folder; an unchanged one is already published and passes straight through.
      const publishLogo = async (
        nextPath: string | null | undefined,
        currentPath: string | null,
        variant: string
      ) => {
        // Clearing the logo still replaces a file: record the old one so it is cleaned up too.
        if (!nextPath) {
          if (currentPath) replacedLogos.push(currentPath)
          return null
        }
        if (nextPath === currentPath) return currentPath

        const published = await finalizeAdminImage({
          storagePath: nextPath,
          uploadDir: LOGO_UPLOAD_DIR,
          publicPath: MEMBER_ORG_LOGOS_PUBLIC_PATH,
          slug: `${validated.initials || validated.denomination}-${variant}`,
          publish: true,
          fallbackBaseName: 'organizacion-logo',
        })
        trackAdminAssetFinalization(cleanupTargets, {
          sourceStoragePath: nextPath,
          storagePath: published,
          allowedPublicPathPrefixes: [MEMBER_ORG_LOGOS_PUBLIC_PATH],
        })
        if (currentPath) replacedLogos.push(currentPath)
        return published
      }

      const logoLight = await publishLogo(validated.logoLight, existingItem.logoLight, 'claro')
      const logoDark = await publishLogo(validated.logoDark, existingItem.logoDark, 'oscuro')

      const updatedRows = await tx
        .update(memberOrgCatalogEntries)
        .set({
          denomination: validated.denomination,
          initials: validated.initials,
          logoLight,
          logoDark,
          order: nextOrder,
          active,
          supersededByEntryId,
        })
        .where(
          validated.updatedAt
            ? and(
                eq(memberOrgCatalogEntries.id, id),
                buildOptimisticLockCondition(memberOrgCatalogEntries.updatedAt, validated.updatedAt)
              )
            : eq(memberOrgCatalogEntries.id, id)
        )
        .returning({ id: memberOrgCatalogEntries.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'memberOrgCatalogEntryOptimisticLock'),
        })
      }

      return tx.query.memberOrgCatalogEntries.findFirst({
        where: eq(memberOrgCatalogEntries.id, id),
      })
    }, 'No se pudo actualizar la organización')

    // The row now points at the new logos, so the ones they replaced can go.
    for (const replaced of replacedLogos) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: replaced, allowedPublicPathPrefixes: [MEMBER_ORG_LOGOS_PUBLIC_PATH] },
        'admin.member-org-catalog.update.cleanup',
        event
      )
    }

    return { data: item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.member-org-catalog.update.rollback',
      event
    )
    throwAdminMutationError('admin.member-org-catalog.update', e, event)
  }
})
