import { createError, defineEventHandler } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../../db'
import { memberOrgCatalogEntries } from '../../../../db/schema'
import {
  getAssociatedMembersResponse,
  getSectorialesResponse,
} from '../../../../utils/public/publicMembers'
import { throwAdminMutationError } from '../../../../utils/admin/adminErrors'
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

    return { data: item }
  } catch (error) {
    throwAdminMutationError('admin.member-org-catalog.refresh', error, event)
  }
})
