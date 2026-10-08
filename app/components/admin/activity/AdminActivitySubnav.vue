<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

defineProps<{
  /** Which sub-view is active */
  active: 'entries' | 'reports'
}>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <nav class="mb-6 flex gap-2 border-b" :aria-label="t('admin.activity.subnav.aria')">
    <UButton
      :to="localePath(ADMIN_ROUTES.activity)"
      :variant="active === 'entries' ? 'solid' : 'ghost'"
      icon="i-tabler-calendar-event"
      size="sm"
      :aria-current="active === 'entries' ? 'page' : undefined"
      class="rounded-b-none"
    >
      {{ t('admin.activity.subnav.entries') }}
    </UButton>
    <UButton
      :to="localePath(ADMIN_ROUTES.activityReports)"
      :variant="active === 'reports' ? 'solid' : 'ghost'"
      icon="i-tabler-report"
      size="sm"
      :aria-current="active === 'reports' ? 'page' : undefined"
      class="rounded-b-none"
    >
      {{ t('admin.activity.subnav.reports') }}
    </UButton>
  </nav>
</template>
