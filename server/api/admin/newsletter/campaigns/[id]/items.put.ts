import { defineEventHandler, readBody } from 'h3'
import { runAdminCrudTransaction } from '../../../../../utils/admin/adminCrud'
import { throwAdminMutationError } from '../../../../../utils/admin/adminErrors'
import { assertOptimisticLock } from '../../../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import {
  assertCampaignIsDraft,
  loadNewsletterCampaign,
  lockDraftCampaignForMutation,
  replaceNewsletterCampaignItems,
} from '../../../../../utils/newsletter/newsletterCampaigns'
import {
  idRouteParamSchema,
  validateBody,
  validateRouteParams,
} from '../../../../../utils/validation'
import { updateNewsletterCampaignItemsSchema } from '~~/shared/utils/adminSchemas'

/**
 * Replacing the item list is a mutation of the campaign, not of a sub-resource: it takes the
 * campaign's `updatedAt`, locks the campaign row and bumps that timestamp, so content edits and
 * text edits contend for the same optimistic lock instead of silently overwriting each other.
 */
export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const data = validateBody(event, updateNewsletterCampaignItemsSchema, await readBody(event))

    const existing = await loadNewsletterCampaign(id)
    assertCampaignIsDraft(event, existing)
    assertOptimisticLock(
      data.updatedAt,
      existing?.updatedAt,
      getAdminApiErrorMessage(event, 'campaignOptimisticLock')
    )

    const campaign = await runAdminCrudTransaction(
      async (tx) => {
        await lockDraftCampaignForMutation(tx, event, id, data.updatedAt)
        await replaceNewsletterCampaignItems(tx, id, data.items)
        return loadNewsletterCampaign(id, tx)
      },
      () => getAdminApiErrorMessage(event, 'campaignItemsSaveFailed')
    )

    return { data: campaign }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.items', error, event)
  }
})
