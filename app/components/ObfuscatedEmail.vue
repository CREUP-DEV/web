<script setup lang="ts">
const props = defineProps<{
  eu: string // btoa(user part before @)
  ed: string // btoa(domain part after @)
  label?: string
  class?: string
}>()

const mounted = ref(false)
const email = computed(() => (mounted.value ? `${atob(props.eu)}@${atob(props.ed)}` : ''))

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <span v-if="!mounted" class="text-muted select-none" aria-hidden="true"> ••••@•••• </span>
  <a v-else :href="`mailto:${email}`" :class="props.class">{{ props.label ?? email }}</a>
</template>
