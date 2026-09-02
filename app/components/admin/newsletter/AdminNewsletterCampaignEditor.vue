<script setup lang="ts">
import { z } from 'zod'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'
import { NEWSLETTER_CAMPAIGN_ITEM_COUNT_WARNING } from '~~/shared/constants/newsletterCampaigns'
import { createNewsletterCampaignSchema } from '~~/shared/utils/adminSchemas'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'
import { hasMeaningfulHtml } from '~~/shared/utils/richText'
import type {
  AdminCampaign,
  AdminCampaignContentEntry,
  AdminCampaignOversizedLocale,
  AdminCampaignUnavailableItem,
} from '@/composables/admin/useAdminNewsletterCampaigns'
import { campaignItemKey } from '@/composables/admin/useAdminCampaignEditor'

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
const { clearErrors, formErrors, getFieldError, validate } = useFormValidation()
const { unavailableReasonLabel } = useAdminCampaignPresentation()
const { getLocaleName } = useLocales()

const campaignRef = toRef(props, 'campaign')

const {
  translations,
  items,
  isResolvingItems,
  hasFormChanges,
  hydrate,
  addEntries,
  removeItemAt,
  removeItemByKey,
  moveItem,
  setOrder,
  buildTextsValidationPayload,
  resetFormSnapshot,
  resolveItemEntries,
  applyCampaign,
  save,
} = useAdminCampaignEditor(campaignRef)

const {
  activeLocale,
  activeIndex,
  idPrefix,
  status,
  invalidLocales,
  revealFirstInvalidLocale,
  panelId,
  panelLabelledBy,
} = useAdminLocaleTabs(translations, ['subject', 'preheader', 'introHtml'], getFieldError)

const isSaving = ref(false)
const showPicker = ref(false)
const previewToken = ref(0)
const blockedItems = ref<AdminCampaignUnavailableItem[]>([])
const oversizedLocales = ref<AdminCampaignOversizedLocale[]>([])

defineExpose({ hasUnsavedChanges: hasFormChanges })

hydrate()
resetFormSnapshot()

// The content endpoint needs the admin session cookie, which only the browser carries.
onMounted(() => {
  void resolveItemEntries()
})

const defaultTranslation = computed(() =>
  translations.value.find((translation) => translation.locale === DEFAULT_LOCALE_CODE)
)

const existingKeys = computed(() => items.value.map((item) => item.key))

const blockedReasonsByKey = computed(() =>
  Object.fromEntries(
    blockedItems.value.map((item) => [
      campaignItemKey(item.itemType, item.itemId),
      unavailableReasonLabel(item.reason),
    ])
  )
)

/** Rendered sizes come back in bytes; kilobytes are what the warning can be acted on with. */
const oversizedRows = computed(() =>
  oversizedLocales.value.map((entry) => ({
    locale: entry.locale,
    name: getLocaleName(entry.locale),
    kb: Math.round(entry.bytes / 1024),
    limitKb: Math.round(entry.limit / 1024),
  }))
)

/**
 * Gmail clips a message past roughly 102KB, which would hide the footer holding the unsubscribe
 * link. The hard limit is enforced server-side on the rendered bytes; this is the early warning.
 */
const showsItemCountWarning = computed(
  () => items.value.length >= NEWSLETTER_CAMPAIGN_ITEM_COUNT_WARNING
)

/**
 * Optional locales are only stored when they carry a subject, so a language holding just a
 * preheader or an intro would lose that text on save. Refuse it instead of dropping it quietly.
 */
const campaignTextsSchema = createNewsletterCampaignSchema.superRefine((data, ctx) => {
  data.translations.forEach((translation, index) => {
    if (translation.locale === DEFAULT_LOCALE_CODE || translation.subject.trim()) {
      return
    }

    if (translation.preheader?.trim() || hasMeaningfulHtml(translation.introHtml)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'admin.validation.campaignSubjectRequiredForLocale',
        path: ['translations', index, 'subject'],
      })
    }
  })
})

const handleSave = async () => {
  if (!validate(campaignTextsSchema, buildTextsValidationPayload())) {
    revealFirstInvalidLocale()
    return
  }

  isSaving.value = true

  try {
    const campaign = await save()
    clearErrors()
    previewToken.value += 1
    emit('updated', campaign)
    toast.add({ title: t('admin.newsletterCampaigns.editor.savedToast'), color: 'success' })
  } catch (error) {
    const fallback =
      getApiErrorStatusCode(error) === 409
        ? t('admin.newsletterCampaigns.editor.conflictToast')
        : t('admin.newsletterCampaigns.editor.saveErrorToast')

    toast.add({ title: getApiErrorMessage(error, fallback), color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const handleAddEntries = (entries: AdminCampaignContentEntry[]) => {
  const added = addEntries(entries)
  const skipped = entries.length - added

  if (skipped > 0) {
    toast.add({
      title: t('admin.newsletterCampaigns.picker.alreadyAddedToast', { count: skipped }),
      color: 'info',
    })
  }
}

const handleRemoveBlocked = (key: string) => {
  removeItemByKey(key)
  blockedItems.value = blockedItems.value.filter(
    (item) => campaignItemKey(item.itemType, item.itemId) !== key
  )
}

const handleRemoveAllBlocked = () => {
  for (const item of [...blockedItems.value]) {
    removeItemByKey(campaignItemKey(item.itemType, item.itemId))
  }

  blockedItems.value = []
}

const handleSent = (campaign: AdminCampaign) => {
  applyCampaign(campaign)
  resetFormSnapshot()
  emit('updated', campaign)
}

const handleCancel = () => {
  router.push(localePath(ADMIN_ROUTES.newsletter))
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
          <h1 class="truncate text-2xl font-bold">
            {{ defaultTranslation?.subject.trim() || t('admin.newsletterCampaigns.list.untitled') }}
          </h1>
        </div>
        <p class="text-muted mt-1 text-sm">{{ t('admin.newsletterCampaigns.editor.subtitle') }}</p>
      </div>

      <div class="flex shrink-0 flex-wrap gap-2">
        <UButton variant="outline" color="neutral" @click="handleCancel">
          {{ t('admin.common.cancel') }}
        </UButton>
        <UButton
          icon="i-tabler-check"
          :loading="isSaving"
          :disabled="isSaving || !hasFormChanges"
          @click="handleSave"
        >
          {{ t('admin.common.save') }}
        </UButton>
      </div>
    </div>

    <AdminFormErrorSummary :errors="formErrors" />

    <div class="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div class="min-w-0 space-y-8">
        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-semibold">
              {{ t('admin.newsletterCampaigns.editor.textsTitle') }}
            </h2>
            <p class="text-muted mt-0.5 text-sm">
              {{ t('admin.newsletterCampaigns.editor.textsHint') }}
            </p>
          </div>

          <AdminLocaleTabs
            v-model="activeLocale"
            :id-prefix="idPrefix"
            :status="status"
            :invalid-locales="invalidLocales"
          />

          <AdminNewsletterCampaignTranslationCard
            v-for="(translation, index) in translations"
            v-show="index === activeIndex"
            :id="panelId(translation.locale)"
            :key="translation.locale"
            v-model:subject="translation.subject"
            v-model:preheader="translation.preheader"
            v-model:intro-html="translation.introHtml"
            role="tabpanel"
            :aria-labelledby="panelLabelledBy(translation.locale)"
            :locale="translation.locale"
            :default-translation="defaultTranslation"
            :subject-error="getFieldError(`translations.${index}.subject`)"
            :preheader-error="getFieldError(`translations.${index}.preheader`)"
          />
        </section>

        <section class="space-y-4">
          <AdminNewsletterCampaignBlockedAlert
            :items="blockedItems"
            :editor-items="items"
            @remove="handleRemoveBlocked"
            @remove-all="handleRemoveAllBlocked"
            @dismiss="blockedItems = []"
          />

          <UAlert
            v-if="oversizedRows.length"
            color="error"
            variant="soft"
            icon="i-tabler-file-alert"
            :title="t('admin.newsletterCampaigns.oversized.title')"
          >
            <template #description>
              <p class="mb-2">{{ t('admin.newsletterCampaigns.oversized.description') }}</p>
              <ul class="list-disc space-y-1 pl-4">
                <li v-for="row in oversizedRows" :key="row.locale">
                  {{
                    t('admin.newsletterCampaigns.oversized.row', {
                      locale: row.name,
                      kb: row.kb,
                      limitKb: row.limitKb,
                    })
                  }}
                </li>
              </ul>
              <UButton
                class="mt-3"
                size="xs"
                variant="ghost"
                color="neutral"
                @click="oversizedLocales = []"
              >
                {{ t('admin.newsletterCampaigns.blocked.dismiss') }}
              </UButton>
            </template>
          </UAlert>

          <UAlert
            v-if="showsItemCountWarning"
            color="warning"
            variant="soft"
            icon="i-tabler-alert-triangle"
            :description="
              t('admin.newsletterCampaigns.editor.tooManyItems', {
                max: NEWSLETTER_CAMPAIGN_ITEM_COUNT_WARNING,
              })
            "
          />

          <AdminNewsletterCampaignItemList
            :items="items"
            :unavailable-reasons="blockedReasonsByKey"
            :loading="isResolvingItems"
            @move="moveItem"
            @remove="removeItemAt"
            @reorder="setOrder"
            @add="showPicker = true"
          />
        </section>

        <AdminNewsletterCampaignPreview
          :campaign-id="campaign.id"
          :reload-token="previewToken"
          :stale="hasFormChanges"
          :saving="isSaving"
          @save="handleSave"
        />
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <AdminNewsletterCampaignSendPanel
          :campaign-id="campaign.id"
          :item-count="items.length"
          :has-unsaved-changes="hasFormChanges"
          @sent="handleSent"
          @blocked="blockedItems = $event"
          @oversized="oversizedLocales = $event"
        />
      </aside>
    </div>

    <AdminNewsletterCampaignContentPicker
      v-model:open="showPicker"
      :existing-keys="existingKeys"
      @add="handleAddEntries"
    />
  </div>
</template>
