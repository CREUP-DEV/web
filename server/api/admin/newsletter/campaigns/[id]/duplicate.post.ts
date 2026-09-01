import { defineEventHandler, createError } from 'h3'
import { sql } from 'drizzle-orm'
import {
  newsletterCampaignItems,
  newsletterCampaignItemTranslations,
  newsletterCampaigns,
  newsletterCampaignTranslations,
} from '../../../../../db/schema'
import { runAdminCrudTransaction } from '../../../../../utils/admin/adminCrud'
import { throwAdminMutationError } from '../../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { loadNewsletterCampaign } from '../../../../../utils/newsletter/newsletterCampaigns'
import { idRouteParamSchema, validateRouteParams } from '../../../../../utils/validation'

/**
 * Copies only what an editor owns: translations, items in order, and their overrides. Never the
 * frozen snapshot, the status or any delivery metric — the copy starts as a fresh draft, and the
 * table's status/`sent_at`/worker-token CHECKs would reject it otherwise.
 *
 * A campaign of any status can be duplicated; reusing the shape of the last send is the point.
 */
export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const campaign = await runAdminCrudTransaction(
      async (tx) => {
        // Share lock on the source: a concurrent edit or delete must land either before the copy
        // starts or after it finishes, never halfway through.
        await tx.execute(
          sql`select 1 from ${newsletterCampaigns} where ${newsletterCampaigns.id} = ${id} for share`
        )

        const source = await loadNewsletterCampaign(id, tx)

        if (!source) {
          throw createError({
            statusCode: 404,
            message: getAdminApiErrorMessage(event, 'campaignNotFound'),
          })
        }

        const [created] = await tx.insert(newsletterCampaigns).values({}).returning({
          id: newsletterCampaigns.id,
        })

        if (!created) {
          return null
        }

        if (source.translations.length > 0) {
          await tx.insert(newsletterCampaignTranslations).values(
            source.translations.map((translation) => ({
              campaignId: created.id,
              locale: translation.locale,
              subject: translation.subject,
              preheader: translation.preheader,
              introHtml: translation.introHtml,
            }))
          )
        }

        if (source.items.length > 0) {
          const copiedItems = await tx
            .insert(newsletterCampaignItems)
            .values(
              source.items.map((item, position) => ({
                campaignId: created.id,
                position,
                itemType: item.itemType,
                itemId: item.itemId,
              }))
            )
            .returning({
              id: newsletterCampaignItems.id,
              itemType: newsletterCampaignItems.itemType,
              itemId: newsletterCampaignItems.itemId,
            })

          // Items are unique per (type, id) within a campaign, so that pair maps old row to new one.
          const copiedIdByKey = new Map(
            copiedItems.map((item) => [`${item.itemType}:${item.itemId}`, item.id])
          )

          const overrideRows = source.items.flatMap((item) => {
            const campaignItemId = copiedIdByKey.get(`${item.itemType}:${item.itemId}`)

            return campaignItemId
              ? item.translations.map((translation) => ({
                  campaignItemId,
                  locale: translation.locale,
                  titleOverride: translation.titleOverride,
                  excerptOverride: translation.excerptOverride,
                }))
              : []
          })

          if (overrideRows.length > 0) {
            await tx.insert(newsletterCampaignItemTranslations).values(overrideRows)
          }
        }

        return loadNewsletterCampaign(created.id, tx)
      },
      () => getAdminApiErrorMessage(event, 'campaignDuplicateFailed')
    )

    return { data: campaign }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.duplicate', error, event)
  }
})
