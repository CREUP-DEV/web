<script setup lang="ts">
import type { AdminActivityTranslation } from '@/composables/admin/useAdminActivity'

const props = defineProps<{
  /** The translation entry for this locale */
  translation: AdminActivityTranslation
  /** Index of this translation within the form list (drives styling + the default-locale flag) */
  index: number
  /** Field error for the title input */
  titleError?: string
  /** Field error for the excerpt textarea */
  excerptError?: string
  /** Field error for the content editor */
  contentError?: string
}>()

const { t } = useI18n()
const { getLocaleFlag, getLocaleName, isDefaultLocale } = useLocales()

const title = defineModel<string>('title', { required: true })
const excerpt = defineModel<string>('excerpt', { required: true })
const contentHtml = defineModel<string>('contentHtml', { required: true })
const imageCaption = defineModel<string>('imageCaption', { required: true })
const alt = defineModel<string>('alt', { required: true })

const isDefault = computed(() => isDefaultLocale(props.translation.locale))
</script>

<template>
  <div class="rounded-xl border p-5" :class="index === 0 ? 'border-primary/30 bg-primary/5' : ''">
    <h3 class="mb-4 flex items-center gap-2 font-semibold">
      <UIcon :name="getLocaleFlag(translation.locale)" class="size-5" />
      {{ getLocaleName(translation.locale) }}
      <UBadge v-if="isDefault" variant="subtle" color="primary" size="sm">
        {{ t('admin.activity.form.requiredBadge') }}
      </UBadge>
      <span v-else class="text-muted text-xs font-normal">{{ t('admin.common.optional') }}</span>
    </h3>

    <div class="space-y-4">
      <UFormField
        :label="
          isDefault
            ? `${t('admin.activity.form.titleLabel')} *`
            : t('admin.activity.form.titleLabel')
        "
        :error="titleError"
      >
        <UInput v-model="title" class="w-full" :required="isDefault" />
      </UFormField>

      <UFormField :label="t('admin.activity.form.excerptLabel')" :error="excerptError">
        <UTextarea
          v-model="excerpt"
          class="w-full"
          :rows="2"
          :placeholder="t('admin.activity.form.excerptPlaceholder')"
        />
      </UFormField>

      <UFormField :label="t('admin.activity.form.contentLabel')" :error="contentError">
        <ClientOnly>
          <LazyAdminRichTextEditor v-model="contentHtml" />
          <template #fallback>
            <UTextarea
              v-model="contentHtml"
              class="w-full"
              :rows="10"
              :placeholder="t('admin.activity.form.contentPlaceholder')"
            />
          </template>
        </ClientOnly>
        <p class="text-muted mt-2 text-xs">
          {{
            isDefault
              ? t('admin.activity.form.contentHintDefault')
              : t('admin.activity.form.contentHintOther')
          }}
        </p>
      </UFormField>

      <UFormField :label="t('admin.activity.form.imageCaptionLabel')">
        <UInput
          v-model="imageCaption"
          class="w-full"
          :placeholder="t('admin.activity.form.imageCaptionPlaceholder')"
        />
      </UFormField>

      <UFormField :label="t('admin.activity.form.altLabel')">
        <UInput
          v-model="alt"
          class="w-full"
          :placeholder="t('admin.activity.form.altPlaceholder')"
        />
      </UFormField>
    </div>
  </div>
</template>
