<script setup lang="ts">
// Catch-all validation summary. Renders every active form error so a failure on a path that no
// individual field surfaces can't silently dead-end the submit button. Pass the `formErrors` list
// from `useFormValidation`.
const props = defineProps<{
  errors: string[]
}>()

const { t } = useI18n()

const hasErrors = computed(() => props.errors.length > 0)
</script>

<template>
  <UAlert
    v-if="hasErrors"
    color="error"
    variant="soft"
    icon="i-tabler-alert-triangle"
    :title="t('admin.validation.summaryTitle')"
    class="mb-6"
  >
    <template #description>
      <ul class="mt-1 list-disc space-y-1 pl-4">
        <li v-for="message in errors" :key="message">{{ message }}</li>
      </ul>
    </template>
  </UAlert>
</template>
