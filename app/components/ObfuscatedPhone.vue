<script setup lang="ts">
// Like <ObfuscatedEmail>: the server sends the number base64-encoded, so it only appears in the page
// once the component mounts.
const props = defineProps<{
  encoded: string // btoa(E.164 phone)
  class?: string
}>()

const mounted = ref(false)
const phone = computed(() => (mounted.value ? atob(props.encoded) : ''))

/** Spanish numbers read as "+34 600 00 00 00"; any other E.164 number is shown as sent. */
const label = computed(() => {
  const spanishNumber = /^\+34(\d{3})(\d{2})(\d{2})(\d{2})$/.exec(phone.value)
  return spanishNumber ? `+34 ${spanishNumber.slice(1).join(' ')}` : phone.value
})

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <span v-if="!mounted" class="text-muted select-none" aria-hidden="true"> +•• ••• •• •• •• </span>
  <a v-else :href="`tel:${phone}`" :class="props.class">{{ label }}</a>
</template>
