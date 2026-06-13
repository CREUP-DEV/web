<script setup lang="ts">
import type { PressTranslationAdmin } from '@/types/adminPress'
import type { PressArticleType } from '~~/shared/constants/pressTypes'

const props = defineProps<{
  /** The translation entry for this locale */
  translation: PressTranslationAdmin
  /** Index of this translation within the form list (drives styling + the default-locale flag) */
  index: number
  /** Current article type (controls visibility of the content editor) */
  type: PressArticleType
  /** Field error for the title input */
  titleError?: string
  /** Field error for the description textarea */
  descriptionError?: string
  /** Field error for the content editor */
  contentError?: string
}>()

const { t } = useI18n()
const { getLocaleFlag, getLocaleName, isDefaultLocale } = useLocales()

const title = defineModel<string>('title', { required: true })
const description = defineModel<string>('description', { required: true })
const contentHtml = defineModel<string>('contentHtml', { required: true })
const alt = defineModel<string>('alt', { required: true })

const isDefault = computed(() => isDefaultLocale(props.translation.locale))
const showContentEditor = computed(
  () => props.type === 'press_release' || props.type === 'statement'
)
</script>

<template>
  <div class="rounded-xl border p-5" :class="index === 0 ? 'border-primary/30 bg-primary/5' : ''">
    <h3 class="mb-4 flex items-center gap-2 font-semibold">
      <UIcon :name="getLocaleFlag(translation.locale)" class="size-5" />
      {{ getLocaleName(translation.locale) }}
      <UBadge v-if="isDefault" variant="subtle" color="primary" size="sm">
        {{ t('admin.press.form.requiredBadge') }}
      </UBadge>
      <span v-else class="text-muted text-xs font-normal">{{ t('admin.common.optional') }}</span>
    </h3>

    <div class="space-y-4">
      <UFormField
        :label="
          isDefault ? `${t('admin.press.form.titleLabel')} *` : t('admin.press.form.titleLabel')
        "
        :error="titleError"
      >
        <UInput v-model="title" class="w-full" :required="isDefault" />
      </UFormField>

      <UFormField
        :label="
          isDefault
            ? `${t('admin.press.form.descriptionLabel')} *`
            : t('admin.press.form.descriptionLabel')
        "
        :error="descriptionError"
      >
        <UTextarea
          v-model="description"
          class="w-full"
          :rows="2"
          :placeholder="t('admin.press.form.descriptionPlaceholder')"
        />
      </UFormField>

      <UFormField
        v-if="showContentEditor"
        :label="t('admin.press.form.contentLabel')"
        :error="contentError"
      >
        <ClientOnly>
          <LazyAdminRichTextEditor v-model="contentHtml" />
          <template #fallback>
            <UTextarea
              v-model="contentHtml"
              class="w-full"
              :rows="10"
              :placeholder="t('admin.press.form.contentPlaceholder')"
            />
          </template>
        </ClientOnly>
        <p class="text-muted mt-2 text-xs">
          {{
            isDefault
              ? t('admin.press.form.contentHintDefault')
              : t('admin.press.form.contentHintOther')
          }}
        </p>
      </UFormField>

      <UFormField :label="t('admin.press.form.altLabel')">
        <UInput v-model="alt" class="w-full" :placeholder="t('admin.press.form.altPlaceholder')" />
      </UFormField>
    </div>
  </div>
</template>
