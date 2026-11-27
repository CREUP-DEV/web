<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import type { AdminCampaign } from '@/composables/admin/useAdminNewsletterCampaigns'
import { CAMPAIGNS_API_BASE } from '@/composables/admin/useAdminNewsletterCampaigns'

definePageMeta({
  layout: 'admin',
})

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const localePath = useLocalePath()
const route = useRoute()
const toast = useAdminToast()

const campaignId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
)
if (!campaignId.value) throw createError({ statusCode: 404 })

const {
  data,
  error: fetchError,
  refresh,
} = await useFetch<{ data: AdminCampaign }>(`${CAMPAIGNS_API_BASE}/${campaignId.value}`, {
  headers: localeApiHeaders,
})

if (fetchError.value || !data.value) {
  if (import.meta.client) {
    toast.add({ title: t('admin.newsletterCampaigns.editor.notFound'), color: 'error' })
  }

  await navigateTo(localePath(ADMIN_ROUTES.newsletter))
}

const campaign = computed(() => data.value?.data ?? null)

/** Only drafts are editable; every other status is the read-only detail view. */
const isDraft = computed(() => campaign.value?.status === 'draft')

const editorRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

const hasUnsavedChanges = () =>
  !allowNavigationWithoutPrompt.value && Boolean(editorRef.value?.hasUnsavedChanges)

useUnsavedChangesGuard(hasUnsavedChanges, () =>
  t('admin.newsletterCampaigns.editor.unsavedChangesPrompt')
)

/**
 * A save, a send, a cancel or a resume all return the campaign reloaded, so the page re-seeds from
 * the response instead of refetching — and swaps to the detail view when the status leaves `draft`.
 */
const handleUpdated = async (next: AdminCampaign) => {
  const leftDraft = next.status !== 'draft'

  // Released before the assignment below: that assignment unmounts the editor that emitted this
  // event, so the leave guard must already be clear rather than relying on unmount ordering.
  if (leftDraft) {
    allowNavigationWithoutPrompt.value = true
  }

  // Mutation responses reload the campaign but carry no `stats`, so the previous block is kept
  // until a refresh brings fresh figures.
  data.value = { data: { ...next, stats: next.stats ?? campaign.value?.stats } as AdminCampaign }

  if (leftDraft) {
    await refresh()
  }
}

useCampaignSendPolling(
  computed(() => campaign.value?.status === 'queued' || campaign.value?.status === 'sending'),
  refresh
)
</script>

<template>
  <AdminNewsletterCampaignEditor
    v-if="campaign && isDraft"
    ref="editorRef"
    :key="campaign.id"
    :campaign="campaign"
    @updated="handleUpdated"
  />
  <AdminNewsletterCampaignDetail
    v-else-if="campaign"
    :campaign="campaign"
    @updated="handleUpdated"
  />
  <AdminPage v-else :title="t('admin.newsletterCampaigns.editor.notFound')">
    <UEmpty
      variant="naked"
      icon="i-tabler-mail-off"
      :description="t('admin.newsletterCampaigns.editor.notFound')"
    />
  </AdminPage>
</template>
