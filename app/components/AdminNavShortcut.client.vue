<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    label: string
    tooltip?: string
  }>(),
  {
    tooltip: undefined,
  }
)

const { session } = useAuth()
const localePath = useLocalePath()

const isAdminUser = computed(() => Boolean(session.value?.data?.user?.id))
const adminPath = computed(() => localePath('/admin'))
</script>

<template>
  <UTooltip v-if="isAdminUser && tooltip" :text="tooltip">
    <UButton
      :to="adminPath"
      icon="i-tabler-settings-2"
      color="neutral"
      variant="ghost"
      :aria-label="label"
      v-bind="$attrs"
    />
  </UTooltip>

  <UButton
    v-else-if="isAdminUser"
    to="/admin"
    icon="i-tabler-settings-2"
    color="neutral"
    variant="ghost"
    :aria-label="label"
    v-bind="$attrs"
  />
</template>
