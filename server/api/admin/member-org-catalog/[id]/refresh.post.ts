import { createError, defineEventHandler } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../../db'
import { memberOrgCatalogEntries } from '../../../../db/schema'
import {
  getAssociatedMembersResponse,
  getSectorialesResponse,
} from '../../../../utils/public/publicMembers'
import { throwAdminMutationError } from '../../../../utils/admin/adminErrors'
import { cleanupUnusedAdminAssetSafely } from '../../../../utils/admin/adminAssetPublication'
import { MEMBER_ORG_LOGOS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'

/** Explicit "refresh from source" action — the sync helper never overwrites locally-edited
 * display fields, so this lets an admin deliberately pull the live denomination/initials/logos
 * back in for one synced row. */
export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.memberOrgCatalogEntries.findFirst({
      where: eq(memberOrgCatalogEntries.id, id),
    })
    if (!existingItem || existingItem.sourceKey === null) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    const liveItem =
      existingItem.source === 'asociado'
        ? (await getAssociatedMembersResponse(event)).members.find(
            (member) => member.id === existingItem.sourceKey
          )
        : (await getSectorialesResponse(event)).sectoriales.find(
            (sectorial) => sectorial.id === existingItem.sourceKey
          )
    if (!liveItem) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    const [item] = await db
      .update(memberOrgCatalogEntries)
      .set({
        denomination: liveItem.denomination,
        initials: liveItem.initials,
        logoLight: liveItem.logoLight,
        logoDark: liveItem.logoDark,
        lastSyncedAt: sql`now()`,
      })
      .where(eq(memberOrgCatalogEntries.id, id))
      .returning()

    // Adopting the upstream logos orphans any that were uploaded here. The cleanup checks the
    // reference registry first, so a file a published activity froze is left alone, and the path
    // prefix guard makes this a no-op for the external URLs the feed supplies.
    for (const previous of [existingItem.logoLight, existingItem.logoDark]) {
      if (!previous || previous === item?.logoLight || previous === item?.logoDark) continue

      await cleanupUnusedAdminAssetSafely(
        { storagePath: previous, allowedPublicPathPrefixes: [MEMBER_ORG_LOGOS_PUBLIC_PATH] },
        'admin.member-org-catalog.refresh.cleanup',
        event
      )
    }

    return { data: item }
  } catch (error) {
    throwAdminMutationError('admin.member-org-catalog.refresh', error, event)
  }
})
