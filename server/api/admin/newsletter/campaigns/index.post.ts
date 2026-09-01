import { defineEventHandler, readBody } from 'h3'
import { newsletterCampaigns, newsletterCampaignTranslations } from '../../../../db/schema'
import { runAdminCrudTransaction } from '../../../../utils/admin/adminCrud'
import { throwAdminMutationError } from '../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import {
  buildCampaignTranslationRows,
  loadNewsletterCampaign,
} from '../../../../utils/newsletter/newsletterCampaigns'
import { validateBody } from '../../../../utils/validation'
import { createNewsletterCampaignSchema } from '~~/shared/utils/adminSchemas'

export default defineEventHandler(async (event) => {
  try {
    const data = validateBody(event, createNewsletterCampaignSchema, await readBody(event))

    const campaign = await runAdminCrudTransaction(
      async (tx) => {
        // Status, delivery metrics and `sent_at` keep their column defaults: the two biconditional
        // CHECKs on the table reject any draft that carries send-time state.
        const [created] = await tx.insert(newsletterCampaigns).values({}).returning({
          id: newsletterCampaigns.id,
        })

        if (!created) {
          return null
        }

        await tx
          .insert(newsletterCampaignTranslations)
          .values(buildCampaignTranslationRows(created.id, data.translations))

        return loadNewsletterCampaign(created.id, tx)
      },
      () => getAdminApiErrorMessage(event, 'campaignCreateFailed')
    )

    return { data: campaign }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.create', error, event)
  }
})
