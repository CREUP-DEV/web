<script setup lang="ts">
defineProps<{
  /** Select items for the media outlet picker */
  mediaOutletItems: Array<{ value: string; label: string }>
  /** Whether supporting data failed to load (disables the outlet select) */
  hasSupportError: boolean
  /** Field error for the external URL input */
  externalUrlError?: string
  /** Field error for the media outlet select */
  mediaOutletError?: string
}>()

const { t } = useI18n()

const externalUrl = defineModel<string | null>('externalUrl', { required: true })
const mediaOutletId = defineModel<string | null>('mediaOutletId', { required: true })
</script>

<template>
  <div class="space-y-4 rounded-xl border p-5">
    <div>
      <h3 class="flex items-center gap-2 font-semibold">
        <UIcon name="i-tabler-broadcast" class="text-muted size-5" />
        {{ t('admin.press.form.mediaAppearanceTitle') }}
      </h3>
      <p class="text-muted mt-1 text-xs">
        {{ t('admin.press.form.mediaAppearanceHint') }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField :label="`${t('admin.press.form.externalUrlLabel')} *`" :error="externalUrlError">
        <UInput
          :model-value="externalUrl ?? undefined"
          placeholder="https://..."
          class="w-full"
          @update:model-value="externalUrl = $event || null"
        />
      </UFormField>

      <UFormField :label="`${t('admin.press.form.mediaOutletLabel')} *`" :error="mediaOutletError">
        <USelectMenu
          :model-value="mediaOutletId ?? undefined"
          :items="mediaOutletItems"
          value-key="value"
          class="w-full"
          :placeholder="t('admin.press.form.mediaOutletPlaceholder')"
          :disabled="hasSupportError"
          @update:model-value="mediaOutletId = $event ?? null"
        />
      </UFormField>
    </div>
  </div>
</template>
