import { createError, defineEventHandler } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { activityEntries, memberOrgCatalogEntries } from '../../../db/schema'
import {
  isConstraintBlockedDeletionError,
  throwAdminMutationError,
} from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { MEMBER_ORG_LOGOS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    // Run the referencing-activity / superseded-by checks and the delete in one transaction with
    // the row locked, so a concurrent activity-creation or supersede can't slip between them. The
    // self-referencing FK (supersededByEntryId) is the backstop for a race that still wins: map it
    // to 409, not 500.
    const uploadedLogos: string[] = []

    await db.transaction(async (tx) => {
      const [existingItem] = await tx
        .select({
          id: memberOrgCatalogEntries.id,
          source: memberOrgCatalogEntries.source,
          selectionKey: memberOrgCatalogEntries.selectionKey,
          logoLight: memberOrgCatalogEntries.logoLight,
          logoDark: memberOrgCatalogEntries.logoDark,
        })
        .from(memberOrgCatalogEntries)
        .where(eq(memberOrgCatalogEntries.id, id))
        .for('update')

      if (!existingItem) {
        throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
      }

      const referencingActivity = await tx.query.activityEntries.findFirst({
        where: and(
          eq(activityEntries.memberOrgSource, existingItem.source),
          eq(activityEntries.memberOrgId, existingItem.selectionKey)
        ),
        columns: { id: true },
      })
      if (referencingActivity) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'memberOrgCatalogEntryDeleteBlocked'),
        })
      }

      const referencingSupersede = await tx.query.memberOrgCatalogEntries.findFirst({
        where: eq(memberOrgCatalogEntries.supersededByEntryId, id),
        columns: { id: true },
      })
      if (referencingSupersede) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'memberOrgCatalogEntrySupersededByReference'),
        })
      }

      uploadedLogos.push(
        ...[existingItem.logoLight, existingItem.logoDark].filter(
          (path): path is string => typeof path === 'string' && path.length > 0
        )
      )

      try {
        await tx.delete(memberOrgCatalogEntries).where(eq(memberOrgCatalogEntries.id, id))
      } catch (deleteError) {
        if (isConstraintBlockedDeletionError(deleteError)) {
          throw createError({
            statusCode: 409,
            message: getAdminApiErrorMessage(event, 'memberOrgCatalogEntrySupersededByReference'),
          })
        }
        throw deleteError
      }
    })

    // Only locally uploaded logos are removed: an upstream URL from a synced row does not sit
    // under this prefix, so the cleanup helper leaves it alone.
    for (const logo of uploadedLogos) {
      await cleanupUnusedAdminAssetSafely(
        { storagePath: logo, allowedPublicPathPrefixes: [MEMBER_ORG_LOGOS_PUBLIC_PATH] },
        'admin.member-org-catalog.delete.cleanup',
        event
      )
    }

    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.member-org-catalog.delete', error, event)
  }
})
