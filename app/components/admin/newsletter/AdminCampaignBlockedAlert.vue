<script setup lang="ts">
import type { AdminCampaignUnavailableItem } from '@/composables/admin/useAdminNewsletterCampaigns'
import type { CampaignEditorItem } from '@/composables/admin/useAdminCampaignEditor'
import { campaignItemKey } from '@/composables/admin/useAdminCampaignEditor'

const props = defineProps<{
  /** Pieces the last send refused to freeze. Empty hides the alert. */
  items: AdminCampaignUnavailableItem[]
  /** The editor's current list, used to name each piece rather than show a bare id. */
  editorItems: CampaignEditorItem[]
}>()

const emit = defineEmits<{
  remove: [key: string]
  removeAll: []
  dismiss: []
}>()

const { t } = useI18n()
const { itemTypeLabel, itemTypeIcon, unavailableReasonLabel } = useAdminCampaignPresentation()

const rows = computed(() =>
  props.items.map((item) => {
    const key = campaignItemKey(item.itemType, item.itemId)
    const editorItem = props.editorItems.find((candidate) => candidate.key === key)

    return {
      key,
      id: item.id,
      itemType: item.itemType,
      title: editorItem?.entry?.title || t('admin.newsletterCampaigns.editor.unknownPiece'),
      reason: unavailableReasonLabel(item.reason),
    }
  })
)
</script>

<template>
  <UAlert
    v-if="rows.length"
    color="error"
    variant="soft"
    icon="i-tabler-alert-triangle"
    :title="t('admin.newsletterCampaigns.blocked.title', { count: rows.length })"
  >
    <template #description>
      <p class="mb-3">{{ t('admin.newsletterCampaigns.blocked.description') }}</p>

      <ul class="space-y-2">
        <li
          v-for="row in rows"
          :key="row.id"
          class="bg-default/60 flex flex-wrap items-center gap-2 rounded-lg p-2"
        >
          <UIcon :name="itemTypeIcon(row.itemType)" class="size-4 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="font-medium">{{ row.title }}</span>
            <span class="text-muted block text-xs">
              {{ itemTypeLabel(row.itemType) }} · {{ row.reason }}
            </span>
          </span>
          <UButton
            size="xs"
            variant="outline"
            color="error"
            icon="i-tabler-trash"
            :aria-label="t('admin.newsletterCampaigns.blocked.removeAria', { title: row.title })"
            @click="emit('remove', row.key)"
          >
            {{ t('admin.newsletterCampaigns.blocked.remove') }}
          </UButton>
        </li>
      </ul>

      <div class="mt-3 flex flex-wrap gap-2">
        <UButton size="xs" color="error" icon="i-tabler-trash-x" @click="emit('removeAll')">
          {{ t('admin.newsletterCampaigns.blocked.removeAll') }}
        </UButton>
        <UButton size="xs" variant="ghost" color="neutral" @click="emit('dismiss')">
          {{ t('admin.newsletterCampaigns.blocked.dismiss') }}
        </UButton>
      </div>
    </template>
  </UAlert>
</template>
