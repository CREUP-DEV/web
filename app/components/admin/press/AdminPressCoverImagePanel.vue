<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import type { useAdminFileUpload } from '@/composables/admin/useAdminFileUpload'

defineProps<{
  /** The image upload composable instance owned by the parent form */
  upload: ReturnType<typeof useAdminFileUpload>
  /** Whether a cover image is currently set (controls the remove button) */
  hasImage: boolean
  /** Field error for the image (highlights the panel and replaces the formats hint) */
  imageError?: string
}>()

const emit = defineEmits<{
  /** User chose to remove the current cover image */
  clear: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="space-y-4 rounded-xl border p-5" :class="imageError ? 'border-error/50' : ''">
    <h3 class="flex items-center gap-2 text-sm font-semibold">
      <UIcon name="i-tabler-photo" class="text-muted size-4" />
      {{ t('admin.press.form.coverImageTitle') }}
    </h3>
    <p class="text-muted text-xs">
      {{ t('admin.press.form.coverImageHintBefore') }}
      <NuxtLink
        :to="localePath(ADMIN_ROUTES.siteDefaultImages)"
        class="text-primary underline underline-offset-2"
      >
        {{ t('admin.press.form.coverImageHintLink') }}
      </NuxtLink>
      {{ t('admin.press.form.coverImageHintAfter') }}
    </p>

    <div v-if="upload.preview.value" class="overflow-hidden rounded-lg border">
      <img
        :src="upload.preview.value"
        :alt="t('admin.press.form.imagePreviewAlt')"
        class="aspect-video w-full object-cover"
      />
    </div>
    <div
      v-else
      class="bg-muted/10 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed"
    >
      <div class="text-muted text-center">
        <UIcon name="i-tabler-photo-plus" class="mx-auto mb-1 size-7 opacity-50" />
        <p class="text-xs">{{ t('admin.press.form.noImage') }}</p>
      </div>
    </div>
    <input
      :ref="upload.inputRef"
      type="file"
      accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
      class="hidden"
      @change="upload.handleFileSelect"
    />
    <div class="flex flex-col gap-2 sm:flex-row">
      <UButton
        type="button"
        variant="outline"
        icon="i-tabler-upload"
        size="sm"
        class="flex-1"
        :loading="upload.isUploading.value"
        @click="upload.triggerFileDialog"
      >
        {{
          upload.preview.value
            ? t('admin.press.form.changeImage')
            : t('admin.press.form.uploadImage')
        }}
      </UButton>
      <UButton
        v-if="hasImage"
        type="button"
        variant="ghost"
        color="error"
        icon="i-tabler-trash"
        size="sm"
        @click="emit('clear')"
      >
        {{ t('admin.press.form.removeImage') }}
      </UButton>
    </div>
    <p v-if="imageError" class="text-error text-xs" role="alert">
      {{ imageError }}
    </p>
    <p v-else class="text-muted text-xs">{{ t('admin.press.form.imageFormats') }}</p>
  </div>
</template>
