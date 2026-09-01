<script setup lang="ts">
import type { AdminCampaignListItem } from '@/composables/admin/useAdminNewsletterCampaigns'
import { campaignEditorPath } from '@/composables/admin/useAdminNewsletterCampaigns'

const props = defineProps<{
  campaign: AdminCampaignListItem
  /** Id of the campaign currently being duplicated, so only its button spins. */
  duplicatingId: string | null
}>()

const emit = defineEmits<{
  duplicate: [campaign: AdminCampaignListItem]
  delete: [campaign: AdminCampaignListItem]
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate } = useLocaleFormatting()
const { statusLabel, statusColor, statusIcon } = useAdminCampaignPresentation()

const isDraft = computed(() => props.campaign.status === 'draft')

const subject = computed(
  () => props.campaign.subject?.trim() || t('admin.newsletterCampaigns.list.untitled')
)

const editorLink = computed(() => localePath(campaignEditorPath(props.campaign.id)))

const shortDate = (value: string) =>
  formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' })

const dateLabel = computed(() => {
  if (props.campaign.sentAt) {
    return t('admin.newsletterCampaigns.list.sentOn', { date: shortDate(props.campaign.sentAt) })
  }

  if (props.campaign.lastDeliveryStartedAt) {
    return t('admin.newsletterCampaigns.list.startedOn', {
      date: shortDate(props.campaign.lastDeliveryStartedAt),
    })
  }

  return t('admin.newsletterCampaigns.list.createdOn', {
    date: shortDate(props.campaign.createdAt),
  })
})

/**
 * Delivery figures only exist once a send has been attempted; a draft shows its item count instead
 * of a row of zeros, which would read as "sent to nobody".
 */
const hasDeliveryFigures = computed(
  () => props.campaign.lastDeliveryTotal !== null || props.campaign.sentAt !== null
)

const failedCount = computed(() => props.campaign.lastDeliveryErrorCount ?? 0)
</script>

<template>
  <article
    class="bg-surface ring-default rounded-xl p-4 shadow-sm ring-1 transition-shadow hover:shadow-md"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge :color="statusColor(campaign.status)" variant="subtle" size="sm">
            <UIcon :name="statusIcon(campaign.status)" class="mr-1 size-3" aria-hidden="true" />
            {{ statusLabel(campaign.status) }}
          </UBadge>
          <span class="text-muted text-xs">{{ dateLabel }}</span>
          <span class="text-muted text-xs">
            {{ t('admin.newsletterCampaigns.list.itemCount', { count: campaign.itemCount }) }}
          </span>
        </div>

        <h3 class="mt-1.5 text-base font-semibold">
          <NuxtLink :to="editorLink" class="hover:text-primary">{{ subject }}</NuxtLink>
        </h3>

        <dl
          v-if="hasDeliveryFigures"
          class="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs"
        >
          <div class="flex items-baseline gap-1.5">
            <dt class="text-muted">{{ t('admin.newsletterCampaigns.list.recipients') }}</dt>
            <dd class="font-semibold">{{ campaign.lastDeliveryTotal ?? 0 }}</dd>
          </div>
          <div class="flex items-baseline gap-1.5">
            <dt class="text-muted">{{ t('admin.newsletterCampaigns.list.delivered') }}</dt>
            <dd class="font-semibold">
              {{ campaign.lastDeliverySentCount ?? 0 }}
              <span v-if="failedCount > 0" class="text-error">
                / {{ t('admin.newsletterCampaigns.list.failedShort', { count: failedCount }) }}
              </span>
            </dd>
          </div>
          <div class="flex items-baseline gap-1.5">
            <dt class="text-muted">{{ t('admin.newsletterCampaigns.list.clicks') }}</dt>
            <dd class="font-semibold">{{ campaign.totalClicks }}</dd>
          </div>
          <div class="flex items-baseline gap-1.5">
            <dt class="text-muted">{{ t('admin.newsletterCampaigns.list.unsubscribes') }}</dt>
            <dd class="font-semibold">{{ campaign.unsubscribeCount }}</dd>
          </div>
        </dl>

        <p v-else class="text-muted mt-2 text-xs">
          {{ t('admin.newsletterCampaigns.list.noDeliveryYet') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <UButton
          :to="editorLink"
          :icon="isDraft ? 'i-tabler-pencil' : 'i-tabler-eye'"
          variant="outline"
          color="neutral"
          size="sm"
        >
          {{
            isDraft
              ? t('admin.newsletterCampaigns.list.editDraft')
              : t('admin.newsletterCampaigns.list.viewDetail')
          }}
        </UButton>
        <UButton
          icon="i-tabler-copy"
          variant="ghost"
          size="sm"
          :loading="duplicatingId === campaign.id"
          :aria-label="t('admin.newsletterCampaigns.list.duplicateAria', { subject })"
          :title="t('admin.newsletterCampaigns.list.duplicate')"
          @click="emit('duplicate', campaign)"
        />
        <UButton
          v-if="isDraft"
          icon="i-tabler-trash"
          variant="ghost"
          color="error"
          size="sm"
          :aria-label="t('admin.newsletterCampaigns.list.deleteAria', { subject })"
          :title="t('admin.common.delete')"
          @click="emit('delete', campaign)"
        />
      </div>
    </div>
  </article>
</template>
