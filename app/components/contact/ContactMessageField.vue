<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    label: string
    placeholder: string
    errorId: string
    error?: string
    ariaDescribedby?: string
    disabled?: boolean
    showError?: boolean
  }>(),
  {
    error: undefined,
    ariaDescribedby: undefined,
    disabled: false,
    showError: false,
  }
)

defineEmits<{
  blur: []
}>()

const trimmedLength = computed(() => model.value.trim().length)
</script>

<template>
  <UFormField :label="label" :error="error">
    <UTextarea
      id="contact-message"
      v-model="model"
      :aria-describedby="ariaDescribedby"
      :placeholder="placeholder"
      :rows="5"
      required
      :disabled="disabled"
      :color="showError ? 'error' : undefined"
      class="w-full"
      @blur="$emit('blur')"
    />
    <template #error>
      <p v-if="error" :id="errorId">
        {{ error }}
      </p>
    </template>
    <template #hint>
      <span :class="trimmedLength < 10 ? 'text-error' : 'text-muted'">
        {{ trimmedLength }}/5000
      </span>
    </template>
  </UFormField>
</template>
