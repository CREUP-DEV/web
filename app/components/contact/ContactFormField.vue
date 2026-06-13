<script setup lang="ts">
const model = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    inputId: string
    label: string
    type: string
    placeholder: string
    errorId: string
    error?: string
    autocomplete?: string
    ariaDescribedby?: string
    required?: boolean
    disabled?: boolean
    showError?: boolean
  }>(),
  {
    error: undefined,
    autocomplete: undefined,
    ariaDescribedby: undefined,
    required: undefined,
    disabled: false,
    showError: false,
  }
)

defineEmits<{
  blur: []
}>()
</script>

<template>
  <UFormField :label="label" :error="error">
    <UInput
      :id="inputId"
      v-model="model"
      :type="type"
      :autocomplete="autocomplete"
      :aria-describedby="ariaDescribedby"
      :placeholder="placeholder"
      :required="required"
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
  </UFormField>
</template>
