<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'
import { createNewsletterCampaignSchema } from '~~/shared/utils/adminSchemas'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import type {
  AdminCampaign,
  AdminCampaignListItem,
} from '@/composables/admin/useAdminNewsletterCampaigns'
import {
  CAMPAIGNS_API_BASE,
  campaignEditorPath,
} from '@/composables/admin/useAdminNewsletterCampaigns'

definePageMeta({
  layout: 'admin',
  title: 'Campañas de newsletter',
})

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const toast = useAdminToast()
const { clearErrors, formErrors, getFieldError, validate } = useFormValidation()

const {
  error: fetchError,
  pending,
  refresh,
  items,
  removeItem,
  updateMeta,
  total,
  page,
  pageSize,
  pageCount,
} = useAdminCampaignList()

const paginationRef = ref<HTMLElement | null>(null)
usePaginationAnchor(page, paginationRef)

const showCreateModal = ref(false)
const newSubject = ref('')
const isCreating = ref(false)
const duplicatingId = ref<string | null>(null)

const showDeleteModal = ref(false)
const campaignToDelete = ref<AdminCampaignListItem | null>(null)
const isDeleting = ref(false)

const openCreate = () => {
  clearErrors()
  newSubject.value = ''
  showCreateModal.value = true
}

const buildCreatePayload = () => ({
  translations: [{ locale: DEFAULT_LOCALE_CODE, subject: newSubject.value.trim() }],
})

/** A campaign starts as a draft holding only its Spanish subject; everything else is the editor. */
const handleCreate = async () => {
  const payload = buildCreatePayload()

  if (!validate(createNewsletterCampaignSchema, payload)) {
    return
  }

  isCreating.value = true

  try {
    const response = await $fetch<{ data: AdminCampaign }>(CAMPAIGNS_API_BASE, {
      method: 'POST',
      body: payload,
    })

    showCreateModal.value = false
    toast.add({ title: t('admin.newsletterCampaigns.list.createdToast'), color: 'success' })
    await router.push(localePath(campaignEditorPath(response.data.id)))
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletterCampaigns.list.createErrorToast')),
      color: 'error',
    })
  } finally {
    isCreating.value = false
  }
}

const handleDuplicate = async (campaign: AdminCampaignListItem) => {
  duplicatingId.value = campaign.id

  try {
    const response = await $fetch<{ data: AdminCampaign }>(
      `${CAMPAIGNS_API_BASE}/${campaign.id}/duplicate`,
      { method: 'POST' }
    )

    toast.add({ title: t('admin.newsletterCampaigns.list.duplicatedToast'), color: 'success' })
    await router.push(localePath(campaignEditorPath(response.data.id)))
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletterCampaigns.list.duplicateErrorToast')),
      color: 'error',
    })
  } finally {
    duplicatingId.value = null
  }
}

const confirmDelete = (campaign: AdminCampaignListItem) => {
  campaignToDelete.value = campaign
  showDeleteModal.value = true
}

const handleDelete = async () => {
  const campaign = campaignToDelete.value
  if (!campaign) return

  isDeleting.value = true

  try {
    await $fetch(`${CAMPAIGNS_API_BASE}/${campaign.id}`, { method: 'DELETE' })
    removeItem(campaign.id)
    updateMeta((meta) => ({ total: Math.max(0, (meta?.total ?? 0) - 1) }))
    showDeleteModal.value = false
    campaignToDelete.value = null
    toast.add({ title: t('admin.newsletterCampaigns.list.deletedToast'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletterCampaigns.list.deleteErrorToast')),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

const deleteTargetSubject = computed(
  () => campaignToDelete.value?.subject?.trim() || t('admin.newsletterCampaigns.list.untitled')
)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.newsletterCampaigns.list.title') }}</h1>
        <p class="text-muted mt-1 text-sm">{{ t('admin.newsletterCampaigns.list.subtitle') }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :to="localePath(ADMIN_ROUTES.newsletterSubscribers)"
          icon="i-tabler-users"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.newsletterCampaigns.list.subscribers') }}
        </UButton>
        <UButton icon="i-tabler-plus" @click="openCreate">
          {{ t('admin.newsletterCampaigns.list.newCampaign') }}
        </UButton>
      </div>
    </div>

    <div v-if="pending && !items.length" class="space-y-3" aria-hidden="true">
      <USkeleton v-for="n in 4" :key="n" class="h-28 w-full rounded-xl" />
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.newsletterCampaigns.list.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else-if="!items.length" class="py-16 text-center">
      <UIcon name="i-tabler-mail-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
      <p class="text-muted mb-4 text-sm">{{ t('admin.newsletterCampaigns.list.empty') }}</p>
      <UButton icon="i-tabler-plus" size="sm" @click="openCreate">
        {{ t('admin.newsletterCampaigns.list.createFirst') }}
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <AdminNewsletterCampaignListRow
        v-for="campaign in items"
        :key="campaign.id"
        :campaign="campaign"
        :duplicating-id="duplicatingId"
        @duplicate="handleDuplicate"
        @delete="confirmDelete"
      />

      <nav
        v-if="pageCount > 1"
        ref="paginationRef"
        class="flex justify-center pt-4"
        :aria-label="t('admin.newsletterCampaigns.list.paginationAria')"
      >
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
      </nav>
    </div>

    <UModal
      v-model:open="showCreateModal"
      :title="t('admin.newsletterCampaigns.list.newModalTitle')"
    >
      <template #body>
        <form class="space-y-5" @submit.prevent="handleCreate">
          <AdminFormErrorSummary :errors="formErrors" />

          <UFormField
            :label="`${t('admin.newsletterCampaigns.fields.subject')} *`"
            :description="t('admin.newsletterCampaigns.list.newModalHint')"
            :error="getFieldError('translations.0.subject')"
          >
            <UInput
              v-model="newSubject"
              class="w-full"
              autofocus
              :placeholder="t('admin.newsletterCampaigns.fields.subjectPlaceholder')"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="outline" color="neutral" @click="showCreateModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton type="submit" :loading="isCreating" :disabled="!newSubject.trim()">
              {{ t('admin.newsletterCampaigns.list.createAndEdit') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="showDeleteModal"
      :title="t('admin.newsletterCampaigns.list.deleteModalTitle')"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">
              {{ t('admin.newsletterCampaigns.list.deleteModalTitle') }}
            </h2>
          </div>
          <p class="text-muted mb-6">
            {{ t('admin.common.deleteConfirm', { name: deleteTargetSubject }) }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">
              {{ t('admin.common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
