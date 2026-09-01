import { defineEventHandler, readBody } from 'h3'
import { runAdminCrudTransaction } from '../../../../utils/admin/adminCrud'
import { throwAdminMutationError } from '../../../../utils/admin/adminErrors'
import { assertOptimisticLock } from '../../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import {
  assertCampaignIsDraft,
  loadNewsletterCampaign,
  lockDraftCampaignForMutation,
  replaceNewsletterCampaignTranslations,
} from '../../../../utils/newsletter/newsletterCampaigns'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../../utils/validation'
import { updateNewsletterCampaignSchema } from '~~/shared/utils/adminSchemas'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const data = validateBody(event, updateNewsletterCampaignSchema, await readBody(event))

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
        await replaceNewsletterCampaignTranslations(tx, id, data.translations)
        return loadNewsletterCampaign(id, tx)
      },
      () => getAdminApiErrorMessage(event, 'campaignUpdateFailed')
    )

    return { data: campaign }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.update', error, event)
  }
})
