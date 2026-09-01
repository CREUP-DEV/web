<script setup lang="ts">
import {
  NEWSLETTER_CAMPAIGN_PREHEADER_MAX_LENGTH,
  NEWSLETTER_CAMPAIGN_SUBJECT_MAX_LENGTH,
} from '~~/shared/constants/newsletterCampaigns'
import { hasMeaningfulHtml } from '~~/shared/utils/richText'
import type { CampaignEditorTranslation } from '@/composables/admin/useAdminCampaignEditor'

/** Intro rich text is capped well below the site's limit: it is one paragraph inside an email. */
const INTRO_MAX_HTML_LENGTH = 5000

const props = defineProps<{
  locale: string
  /** The Spanish entry, so an empty field can show the text it will actually inherit. */
  defaultTranslation: CampaignEditorTranslation | undefined
  subjectError?: string
  preheaderError?: string
}>()

const subject = defineModel<string>('subject', { required: true })
const preheader = defineModel<string>('preheader', { required: true })
const introHtml = defineModel<string>('introHtml', { required: true })

const { t } = useI18n()
const { getLocaleFlag, getLocaleName, isDefaultLocale } = useLocales()

const isDefault = computed(() => isDefaultLocale(props.locale))

const inheritedSubject = computed(() => props.defaultTranslation?.subject.trim() || '')
const inheritedPreheader = computed(() => props.defaultTranslation?.preheader.trim() || '')
const hasInheritedIntro = computed(() => hasMeaningfulHtml(props.defaultTranslation?.introHtml))

const showsSubjectInheritance = computed(() => !isDefault.value && !subject.value.trim())
const showsPreheaderInheritance = computed(() => !isDefault.value && !preheader.value.trim())
const showsIntroInheritance = computed(
  () => !isDefault.value && !hasMeaningfulHtml(introHtml.value)
)

/**
 * A locale is only stored when it carries a subject, so text written into the other two fields of
 * an otherwise-empty language would be dropped on save. Say so before the save happens.
 */
const hasOrphanText = computed(
  () =>
    !isDefault.value &&
    !subject.value.trim() &&
    (Boolean(preheader.value.trim()) || hasMeaningfulHtml(introHtml.value))
)
</script>

<template>
  <div class="rounded-xl border p-5" :class="isDefault ? 'border-primary/30 bg-primary/5' : ''">
    <h3 class="mb-4 flex items-center gap-2 font-semibold">
      <UIcon :name="getLocaleFlag(locale)" class="size-5" aria-hidden="true" />
      {{ getLocaleName(locale) }}
      <UBadge v-if="isDefault" variant="subtle" color="primary" size="sm">
        {{ t('admin.newsletterCampaigns.editor.requiredBadge') }}
      </UBadge>
      <span v-else class="text-muted text-xs font-normal">{{ t('admin.common.optional') }}</span>
    </h3>

    <UAlert
      v-if="hasOrphanText"
      class="mb-4"
      color="warning"
      variant="soft"
      icon="i-tabler-alert-triangle"
      :title="t('admin.newsletterCampaigns.editor.orphanTextTitle')"
      :description="t('admin.newsletterCampaigns.editor.orphanTextDescription')"
    />

    <div class="space-y-4">
      <UFormField
        :label="
          isDefault
            ? `${t('admin.newsletterCampaigns.fields.subject')} *`
            : t('admin.newsletterCampaigns.fields.subject')
        "
        :error="subjectError"
      >
        <UInput
          v-model="subject"
          class="w-full"
          :maxlength="NEWSLETTER_CAMPAIGN_SUBJECT_MAX_LENGTH"
          :required="isDefault"
          :placeholder="t('admin.newsletterCampaigns.fields.subjectPlaceholder')"
        />
        <p v-if="showsSubjectInheritance" class="text-muted mt-1.5 text-xs">
          <UIcon name="i-tabler-arrow-down-right" class="mr-0.5 size-3.5" aria-hidden="true" />
          <template v-if="inheritedSubject">
            {{ t('admin.newsletterCampaigns.editor.inheritsValue', { value: inheritedSubject }) }}
          </template>
          <template v-else>{{ t('admin.newsletterCampaigns.editor.inheritsSpanish') }}</template>
        </p>
      </UFormField>

      <UFormField
        :label="t('admin.newsletterCampaigns.fields.preheader')"
        :description="t('admin.newsletterCampaigns.fields.preheaderHint')"
        :error="preheaderError"
      >
        <UInput
          v-model="preheader"
          class="w-full"
          :maxlength="NEWSLETTER_CAMPAIGN_PREHEADER_MAX_LENGTH"
          :placeholder="t('admin.newsletterCampaigns.fields.preheaderPlaceholder')"
        />
        <p v-if="showsPreheaderInheritance && inheritedPreheader" class="text-muted mt-1.5 text-xs">
          <UIcon name="i-tabler-arrow-down-right" class="mr-0.5 size-3.5" aria-hidden="true" />
          {{ t('admin.newsletterCampaigns.editor.inheritsValue', { value: inheritedPreheader }) }}
        </p>
      </UFormField>

      <UFormField
        :label="t('admin.newsletterCampaigns.fields.intro')"
        :description="t('admin.newsletterCampaigns.fields.introHint')"
      >
        <ClientOnly>
          <LazyAdminRichTextEditor
            v-model="introHtml"
            variant="inline"
            :max-html-length="INTRO_MAX_HTML_LENGTH"
          />
          <template #fallback>
            <UTextarea v-model="introHtml" class="w-full" :rows="4" />
          </template>
        </ClientOnly>
        <p v-if="showsIntroInheritance && hasInheritedIntro" class="text-muted mt-1.5 text-xs">
          <UIcon name="i-tabler-arrow-down-right" class="mr-0.5 size-3.5" aria-hidden="true" />
          {{ t('admin.newsletterCampaigns.editor.inheritsSpanishIntro') }}
        </p>
      </UFormField>
    </div>
  </div>
</template>
