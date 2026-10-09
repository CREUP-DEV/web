<script setup lang="ts">
defineProps<{
  pending: boolean
  failed: boolean
  errorTitle: string
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="pending" aria-hidden="true">
    <slot name="skeleton" />
  </div>

  <div v-else-if="failed" class="space-y-3">
    <UAlert color="error" variant="soft" icon="i-tabler-alert-triangle" :title="errorTitle" />
    <UButton
      class="no-print"
      variant="outline"
      color="neutral"
      icon="i-tabler-refresh"
      @click="emit('retry')"
    >
      {{ t('home.retry') }}
    </UButton>
  </div>

  <slot v-else />
</template>
