<script setup lang="ts">
import { newsletterCampaignTestSendSchema } from '~~/shared/utils/adminSchemas'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import type {
  AdminCampaign,
  AdminCampaignOversizedLocale,
  AdminCampaignUnavailableItem,
} from '@/composables/admin/useAdminNewsletterCampaigns'
import {
  CAMPAIGNS_API_BASE,
  extractOversizedCampaignLocales,
  extractUnavailableCampaignItems,
} from '@/composables/admin/useAdminNewsletterCampaigns'

const props = defineProps<{
  campaignId: string
  itemCount: number
  /** Blocks the send while the draft holds edits the server has not stored yet. */
  hasUnsavedChanges: boolean
}>()

const emit = defineEmits<{
  sent: [campaign: AdminCampaign]
  blocked: [items: AdminCampaignUnavailableItem[]]
  oversized: [locales: AdminCampaignOversizedLocale[]]
}>()

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { localeConfigs, getLocaleName, defaultLocale } = useLocales()
const { clearErrors, formErrors, getFieldError, validate } = useFormValidation()

/**
 * Client-only on purpose. The request needs the admin session cookie, which server-side rendering
 * does not forward: a rejected SSR call would resolve to no data and never retry on hydration,
 * leaving the count at zero — which reads as "no subscribers" and disables the send outright.
 */
const { data: subscriberData } = useFetch<{
  meta: { activeTotal: number }
}>('/api/admin/newsletter/subscribers', {
  headers: localeApiHeaders,
  query: { limit: 1 },
  server: false,
  lazy: true,
})

const recipientCount = computed(() => subscriberData.value?.meta?.activeTotal ?? 0)

/**
 * Whether the count has actually arrived, rather than whether a request is in flight. With
 * `server: false` the request never starts during SSR, so `pending` is false there and true right
 * after hydration — rendering one branch on the server and the other on the client. This is false
 * in both places until the data lands, so the two agree.
 */
const subscribersLoaded = computed(() => subscriberData.value != null)

const testEmail = ref('')
const testLocale = ref(defaultLocale)
const isTestSending = ref(false)

const showSendModal = ref(false)
const confirmationInput = ref('')
const isSending = ref(false)

const localeItems = computed(() =>
  localeConfigs.value.map((config) => ({
    label: getLocaleName(config.code),
    value: config.code,
  }))
)

/**
 * The send is irreversible, mass, and there are no admin roles to fall back on: typing the word is
 * the only barrier between a stray click and every subscriber's inbox.
 */
const confirmationWord = computed(() => t('admin.newsletterCampaigns.send.confirmWord'))
const isConfirmed = computed(
  () => confirmationInput.value.trim().toLowerCase() === confirmationWord.value.toLowerCase()
)

const blockingReason = computed(() => {
  if (props.hasUnsavedChanges) return t('admin.newsletterCampaigns.send.blockedUnsaved')
  if (props.itemCount === 0) return t('admin.newsletterCampaigns.send.blockedEmpty')

  // Only once the count has actually arrived — a pending fetch reads as zero, and claiming there
  // are no subscribers while still loading would be a lie the admin cannot act on.
  if (subscribersLoaded.value && recipientCount.value === 0) {
    return t('admin.newsletterCampaigns.send.blockedNoRecipients')
  }

  return null
})

const handleTestSend = async () => {
  const payload = { email: testEmail.value.trim(), locale: testLocale.value }

  if (!validate(newsletterCampaignTestSendSchema, payload)) {
    return
  }

  isTestSending.value = true

  try {
    await $fetch(`${CAMPAIGNS_API_BASE}/${props.campaignId}/test-send`, {
      method: 'POST',
      body: payload,
    })
    clearErrors()
    toast.add({ title: t('admin.newsletterCampaigns.send.testSentToast'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletterCampaigns.send.testErrorToast')),
      color: 'error',
    })
  } finally {
    isTestSending.value = false
  }
}

const openSendModal = () => {
  confirmationInput.value = ''
  showSendModal.value = true
}

const handleSend = async () => {
  if (!isConfirmed.value) return

  isSending.value = true

  try {
    const response = await $fetch<{ data: AdminCampaign }>(
      `${CAMPAIGNS_API_BASE}/${props.campaignId}/send`,
      { method: 'POST' }
    )

    showSendModal.value = false
    emit('blocked', [])
    emit('oversized', [])
    emit('sent', response.data)
    toast.add({ title: t('admin.newsletterCampaigns.send.startedToast'), color: 'success' })
  } catch (error) {
    // Two of the send's rejections carry a structured payload. Both are raised next to the content
    // list, where they can actually be acted on; a toast would scroll away before anyone could
    // read which pieces or which languages were at fault.
    const unavailable = extractUnavailableCampaignItems(error)
    const oversized = extractOversizedCampaignLocales(error)

    if (unavailable.length || oversized.length) {
      showSendModal.value = false
      emit('blocked', unavailable)
      emit('oversized', oversized)
      toast.add({
        title: unavailable.length
          ? t('admin.newsletterCampaigns.send.blockedToast', { count: unavailable.length })
          : t('admin.newsletterCampaigns.send.oversizedToast', { count: oversized.length }),
        color: 'warning',
      })
    } else {
      toast.add({
        title: getApiErrorMessage(error, t('admin.newsletterCampaigns.send.errorToast')),
        color: 'error',
      })
    }
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <section class="bg-surface ring-default space-y-4 rounded-xl p-5 shadow-sm ring-1">
    <h2 class="text-lg font-semibold">{{ t('admin.newsletterCampaigns.send.title') }}</h2>

    <div class="flex items-baseline gap-2">
      <USkeleton v-if="!subscribersLoaded" class="h-7 w-12" />
      <span v-else class="text-2xl font-bold tabular-nums">{{ recipientCount }}</span>
      <span class="text-muted text-sm">{{ t('admin.newsletterCampaigns.send.recipients') }}</span>
    </div>

    <div class="space-y-3 border-t pt-4">
      <h3 class="text-sm font-semibold">{{ t('admin.newsletterCampaigns.send.testTitle') }}</h3>
      <p class="text-muted text-xs">{{ t('admin.newsletterCampaigns.send.testHint') }}</p>

      <form class="space-y-3" @submit.prevent="handleTestSend">
        <AdminFormErrorSummary :errors="formErrors" />

        <UFormField
          :label="t('admin.newsletterCampaigns.send.testEmailLabel')"
          :error="getFieldError('email')"
        >
          <UInput
            v-model="testEmail"
            type="email"
            class="w-full"
            :placeholder="t('admin.newsletterCampaigns.send.testEmailPlaceholder')"
          />
        </UFormField>

        <UFormField
          :label="t('admin.newsletterCampaigns.send.testLocaleLabel')"
          :error="getFieldError('locale')"
        >
          <USelect v-model="testLocale" :items="localeItems" value-key="value" class="w-full" />
        </UFormField>

        <UButton
          type="submit"
          variant="outline"
          color="neutral"
          icon="i-tabler-mail-fast"
          :loading="isTestSending"
          :disabled="!testEmail.trim()"
          block
        >
          {{ t('admin.newsletterCampaigns.send.testButton') }}
        </UButton>
      </form>
    </div>

    <div class="space-y-3 border-t pt-4">
      <UAlert
        v-if="blockingReason"
        color="warning"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :description="blockingReason"
      />

      <UButton
        icon="i-tabler-send"
        color="primary"
        :disabled="Boolean(blockingReason) || !subscribersLoaded"
        block
        @click="openSendModal"
      >
        {{ t('admin.newsletterCampaigns.send.sendButton') }}
      </UButton>
    </div>

    <UModal v-model:open="showSendModal" :title="t('admin.newsletterCampaigns.send.modalTitle')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-alert-triangle" class="text-warning size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.newsletterCampaigns.send.modalTitle') }}</h2>
          </div>

          <p class="text-muted mb-2">
            {{
              t('admin.newsletterCampaigns.send.modalBody', {
                count: recipientCount,
                items: itemCount,
              })
            }}
          </p>
          <p class="text-muted mb-4 text-sm">
            {{ t('admin.newsletterCampaigns.send.modalIrreversible') }}
          </p>

          <UFormField
            :label="t('admin.newsletterCampaigns.send.confirmLabel', { word: confirmationWord })"
          >
            <UInput
              v-model="confirmationInput"
              class="w-full"
              autocomplete="off"
              :placeholder="confirmationWord"
            />
          </UFormField>

          <div class="mt-6 flex justify-end gap-2">
            <UButton variant="ghost" @click="showSendModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton
              color="primary"
              icon="i-tabler-send"
              :disabled="!isConfirmed"
              :loading="isSending"
              @click="handleSend"
            >
              {{ t('admin.newsletterCampaigns.send.sendNow') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>
