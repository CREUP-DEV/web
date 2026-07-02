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
  <div
    class="mb-6 flex gap-2 border-b"
    role="tablist"
    :aria-label="t('admin.activity.subnav.aria')"
  >
    <UButton
      :to="localePath(ADMIN_ROUTES.activity)"
      :variant="active === 'entries' ? 'solid' : 'ghost'"
      icon="i-tabler-calendar-event"
      size="sm"
      role="tab"
      :aria-selected="active === 'entries'"
      class="rounded-b-none"
    >
      {{ t('admin.activity.subnav.entries') }}
    </UButton>
    <UButton
      :to="localePath(ADMIN_ROUTES.activityReports)"
      :variant="active === 'reports' ? 'solid' : 'ghost'"
      icon="i-tabler-report"
      size="sm"
      role="tab"
      :aria-selected="active === 'reports'"
      class="rounded-b-none"
    >
      {{ t('admin.activity.subnav.reports') }}
    </UButton>
  </div>
</template>
