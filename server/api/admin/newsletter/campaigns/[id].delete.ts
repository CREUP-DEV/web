import { defineEventHandler } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { newsletterCampaigns } from '../../../../db/schema'
import { throwAdminMutationError } from '../../../../utils/admin/adminErrors'
import { assertCampaignIsDraft } from '../../../../utils/newsletter/newsletterCampaigns'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    // Deleting under the status predicate closes the window between checking and deleting; the
    // zero-row case is then re-read only to tell 404 apart from "no longer a draft". Translations,
    // items, item overrides and deliveries all cascade, and a draft holds no frozen snapshot, so
    // there are no stored assets to reclaim.
    const deleted = await db
      .delete(newsletterCampaigns)
      .where(and(eq(newsletterCampaigns.id, id), eq(newsletterCampaigns.status, 'draft')))
      .returning({ id: newsletterCampaigns.id })

    if (deleted.length === 0) {
      const current = await db.query.newsletterCampaigns.findFirst({
        where: eq(newsletterCampaigns.id, id),
        columns: { id: true, status: true },
      })

      assertCampaignIsDraft(event, current)
    }

    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.delete', error, event)
  }
})
