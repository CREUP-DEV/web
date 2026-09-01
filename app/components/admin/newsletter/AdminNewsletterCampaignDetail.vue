<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import type { NewsletterCampaignItemType } from '~~/shared/constants/newsletterCampaigns'
import type {
  AdminCampaign,
  AdminCampaignItem,
} from '@/composables/admin/useAdminNewsletterCampaigns'
import {
  CAMPAIGNS_API_BASE,
  campaignEditorPath,
} from '@/composables/admin/useAdminNewsletterCampaigns'

const props = defineProps<{
  campaign: AdminCampaign
}>()

const emit = defineEmits<{
  updated: [campaign: AdminCampaign]
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const toast = useAdminToast()
const { formatDateTime } = useLocaleFormatting()
const { statusLabel, statusColor, statusIcon, itemTypeLabel, itemTypeIcon } =
  useAdminCampaignPresentation()

const isResuming = ref(false)
const isCancelling = ref(false)
const isDuplicating = ref(false)
const showCancelModal = ref(false)

const subject = computed(
  () =>
    props.campaign.translations
      .find((translation) => translation.locale === DEFAULT_LOCALE_CODE)
      ?.subject.trim() || t('admin.newsletterCampaigns.list.untitled')
)

const isActive = computed(
  () => props.campaign.status === 'queued' || props.campaign.status === 'sending'
)

/** `sent` is terminal — nothing is outstanding, so no retry is offered there. */
const canResume = computed(
  () => props.campaign.status === 'paused' || props.campaign.status === 'failed'
)

const delivery = computed(() => props.campaign.stats.delivery)

const failedRecipients = computed(() => props.campaign.lastDeliveryFailedRecipients ?? [])

const timestamp = (value: string | null) =>
  value ? formatDateTime(value, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** Sent campaigns render from their frozen snapshot, which survives the piece being deleted. */
const itemTitle = (item: AdminCampaignItem) => {
  const locales = item.snapshot?.locales ?? {}
  return (
    locales[DEFAULT_LOCALE_CODE]?.title ||
    Object.values(locales).find((entry) => entry?.title)?.title ||
    t('admin.newsletterCampaigns.editor.unknownPiece')
  )
}

const rankedItems = computed(() =>
  [...props.campaign.items].sort((left, right) => right.clickCount - left.clickCount)
)

const clicksByType = computed(() => {
  const totals = new Map<NewsletterCampaignItemType, number>()

  for (const item of props.campaign.items) {
    totals.set(item.itemType, (totals.get(item.itemType) ?? 0) + item.clickCount)
  }

  return [...totals.entries()]
    .map(([itemType, clicks]) => ({ itemType, clicks }))
    .sort((left, right) => right.clicks - left.clicks)
})

const runAction = async (
  request: () => Promise<{ data: AdminCampaign }>,
  flag: Ref<boolean>,
  successKey: string,
  errorKey: string
) => {
  flag.value = true

  try {
    const response = await request()
    emit('updated', response.data)
    toast.add({ title: t(successKey), color: 'success' })
    return response.data
  } catch (error) {
    toast.add({ title: getApiErrorMessage(error, t(errorKey)), color: 'error' })
    return null
  } finally {
    flag.value = false
  }
}

const handleResume = async () => {
  await runAction(
    () =>
      $fetch<{ data: AdminCampaign }>(`${CAMPAIGNS_API_BASE}/${props.campaign.id}/resume`, {
        method: 'POST',
      }),
    isResuming,
    'admin.newsletterCampaigns.detail.resumedToast',
    'admin.newsletterCampaigns.detail.resumeErrorToast'
  )
}

const handleCancel = async () => {
  const result = await runAction(
    () =>
      $fetch<{ data: AdminCampaign }>(`${CAMPAIGNS_API_BASE}/${props.campaign.id}/send`, {
        method: 'DELETE',
      }),
    isCancelling,
    'admin.newsletterCampaigns.detail.cancelledToast',
    'admin.newsletterCampaigns.detail.cancelErrorToast'
  )

  if (result) {
    showCancelModal.value = false
  }
}

const handleDuplicate = async () => {
  isDuplicating.value = true

  try {
    const response = await $fetch<{ data: AdminCampaign }>(
      `${CAMPAIGNS_API_BASE}/${props.campaign.id}/duplicate`,
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
    isDuplicating.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <UButton
            :to="localePath(ADMIN_ROUTES.newsletter)"
            icon="i-tabler-arrow-left"
            variant="ghost"
            color="neutral"
            size="sm"
            :aria-label="t('admin.common.back')"
          />
          <h1 class="truncate text-2xl font-bold">{{ subject }}</h1>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <UBadge :color="statusColor(campaign.status)" variant="subtle">
            <UIcon :name="statusIcon(campaign.status)" class="mr-1 size-3" aria-hidden="true" />
            {{ statusLabel(campaign.status) }}
          </UBadge>
          <span class="text-muted text-sm">
            {{ t('admin.newsletterCampaigns.detail.readOnly') }}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 flex-wrap gap-2">
        <UButton
          icon="i-tabler-copy"
          variant="outline"
          color="neutral"
          :loading="isDuplicating"
          @click="handleDuplicate"
        >
          {{ t('admin.newsletterCampaigns.list.duplicate') }}
        </UButton>
        <UButton
          v-if="canResume"
          icon="i-tabler-refresh"
          :loading="isResuming"
          @click="handleResume"
        >
          {{
            campaign.status === 'failed'
              ? t('admin.newsletterCampaigns.detail.retryPending')
              : t('admin.newsletterCampaigns.detail.resume')
          }}
        </UButton>
        <UButton
          v-if="isActive"
          icon="i-tabler-player-stop"
          color="error"
          variant="outline"
          @click="showCancelModal = true"
        >
          {{ t('admin.newsletterCampaigns.detail.cancelSend') }}
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="campaign.status === 'failed'"
      class="mb-6"
      color="warning"
      variant="soft"
      icon="i-tabler-alert-triangle"
      :title="t('admin.newsletterCampaigns.detail.failedTitle')"
      :description="t('admin.newsletterCampaigns.detail.failedDescription')"
    />

    <div class="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div class="min-w-0 space-y-8">
        <section class="bg-surface ring-default rounded-xl p-5 shadow-sm ring-1">
          <h2 class="mb-4 text-lg font-semibold">
            {{ t('admin.newsletterCampaigns.detail.deliveryTitle') }}
          </h2>

          <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt class="text-muted text-xs">
                {{ t('admin.newsletterCampaigns.detail.total') }}
              </dt>
              <dd class="text-xl font-bold tabular-nums">{{ delivery.total }}</dd>
            </div>
            <div>
              <dt class="text-muted text-xs">
                {{ t('admin.newsletterCampaigns.detail.delivered') }}
              </dt>
              <dd class="text-success text-xl font-bold tabular-nums">{{ delivery.sent }}</dd>
            </div>
            <div>
              <dt class="text-muted text-xs">
                {{ t('admin.newsletterCampaigns.detail.pending') }}
              </dt>
              <dd class="text-xl font-bold tabular-nums">
                {{ delivery.queued + delivery.sending }}
              </dd>
            </div>
            <div>
              <dt class="text-muted text-xs">
                {{ t('admin.newsletterCampaigns.detail.failed') }}
              </dt>
              <dd
                class="text-xl font-bold tabular-nums"
                :class="delivery.failed > 0 ? 'text-error' : ''"
              >
                {{ delivery.failed }}
              </dd>
            </div>
          </dl>

          <dl class="mt-4 grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
            <div class="flex justify-between gap-2">
              <dt class="text-muted">{{ t('admin.newsletterCampaigns.detail.startedAt') }}</dt>
              <dd>{{ timestamp(campaign.lastDeliveryStartedAt) }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-muted">{{ t('admin.newsletterCampaigns.detail.finishedAt') }}</dt>
              <dd>{{ timestamp(campaign.lastDeliveryFinishedAt) }}</dd>
            </div>
          </dl>

          <div v-if="failedRecipients.length" class="mt-4 border-t pt-4">
            <h3 class="mb-2 text-sm font-semibold">
              {{ t('admin.newsletterCampaigns.detail.failedRecipients') }}
            </h3>
            <ul class="text-muted max-h-40 space-y-0.5 overflow-y-auto text-xs">
              <li v-for="email in failedRecipients" :key="email">{{ email }}</li>
            </ul>
          </div>
        </section>

        <section class="bg-surface ring-default rounded-xl p-5 shadow-sm ring-1">
          <h2 class="mb-1 text-lg font-semibold">
            {{ t('admin.newsletterCampaigns.detail.clicksTitle') }}
          </h2>
          <p class="text-muted mb-4 text-xs">
            {{ t('admin.newsletterCampaigns.detail.clicksCaveat') }}
          </p>

          <div v-if="clicksByType.length" class="mb-4 flex flex-wrap gap-4 border-b pb-4">
            <div
              v-for="row in clicksByType"
              :key="row.itemType"
              class="flex items-baseline gap-1.5"
            >
              <UIcon :name="itemTypeIcon(row.itemType)" class="size-4" aria-hidden="true" />
              <span class="text-muted text-xs">{{ itemTypeLabel(row.itemType) }}</span>
              <span class="font-semibold tabular-nums">{{ row.clicks }}</span>
            </div>
          </div>

          <ul class="space-y-2">
            <li
              v-for="item in rankedItems"
              :key="item.id"
              class="flex items-center justify-between gap-3 text-sm"
            >
              <span class="flex min-w-0 items-center gap-2">
                <UIcon
                  :name="itemTypeIcon(item.itemType)"
                  class="text-muted size-4 shrink-0"
                  aria-hidden="true"
                />
                <span class="truncate">{{ itemTitle(item) }}</span>
              </span>
              <span class="shrink-0 font-semibold tabular-nums">{{ item.clickCount }}</span>
            </li>
          </ul>

          <p v-if="!rankedItems.length" class="text-muted text-sm">
            {{ t('admin.newsletterCampaigns.detail.noItems') }}
          </p>
        </section>

        <AdminNewsletterCampaignPreview :campaign-id="campaign.id" />
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <section class="bg-surface ring-default space-y-3 rounded-xl p-5 shadow-sm ring-1">
          <h2 class="text-lg font-semibold">
            {{ t('admin.newsletterCampaigns.detail.summaryTitle') }}
          </h2>
          <dl class="space-y-2 text-sm">
            <div class="flex items-baseline justify-between gap-2">
              <dt class="text-muted">{{ t('admin.newsletterCampaigns.detail.itemCount') }}</dt>
              <dd class="font-semibold tabular-nums">{{ campaign.stats.itemCount }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-2">
              <dt class="text-muted">{{ t('admin.newsletterCampaigns.detail.totalClicks') }}</dt>
              <dd class="font-semibold tabular-nums">{{ campaign.stats.totalClicks }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-2">
              <dt class="text-muted">{{ t('admin.newsletterCampaigns.detail.unsubscribes') }}</dt>
              <dd class="font-semibold tabular-nums">{{ campaign.stats.unsubscribeCount }}</dd>
            </div>
          </dl>
          <p class="text-muted text-xs">
            {{ t('admin.newsletterCampaigns.detail.unsubscribesHint') }}
          </p>
        </section>
      </aside>
    </div>

    <UModal
      v-model:open="showCancelModal"
      :title="t('admin.newsletterCampaigns.detail.cancelSend')"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-player-stop" class="text-warning size-6" />
            </div>
            <h2 class="text-lg font-bold">
              {{ t('admin.newsletterCampaigns.detail.cancelSend') }}
            </h2>
          </div>
          <p class="text-muted mb-6">
            {{ t('admin.newsletterCampaigns.detail.cancelConfirm') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCancelModal = false">
              {{ t('admin.common.back') }}
            </UButton>
            <UButton color="error" :loading="isCancelling" @click="handleCancel">
              {{ t('admin.newsletterCampaigns.detail.cancelSend') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
