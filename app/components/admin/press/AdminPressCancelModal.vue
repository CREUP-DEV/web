<script setup lang="ts">
const emit = defineEmits<{
  /** User chose to discard unsaved changes */
  confirm: []
}>()

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('admin.press.form.cancelModalTitle')"
    :description="t('admin.press.form.cancelModalBody')"
    :ui="{ content: 'sm:max-w-sm' }"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon name="i-tabler-alert-triangle" class="text-warning size-6" />
          </div>
          <h2 class="text-base font-bold">{{ t('admin.press.form.cancelModalTitle') }}</h2>
        </div>
        <p class="text-muted mb-6 text-sm">
          {{ t('admin.press.form.cancelModalBody') }}
        </p>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="open = false">{{
            t('admin.press.form.keepEditing')
          }}</UButton>
          <UButton color="warning" @click="emit('confirm')">{{
            t('admin.press.form.discardChanges')
          }}</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
