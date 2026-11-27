<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import { adminBreadcrumbAncestors, toCanonicalAdminPath } from '~/utils/adminNavigation'

/**
 * The breadcrumb row under a page's navbar: where the page sits and the way back up. The levels
 * come from the route (adminBreadcrumbAncestors); the last crumb is the page on show (`current`)
 * and is not a link. A page with no level above it gets no row: its navbar already names it.
 *
 * Large screens show the whole trail; below `lg` it is a single link to the level above, as tall
 * as a thumb needs.
 */
const props = defineProps<{ current: string }>()

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const ancestors = computed(() =>
  adminBreadcrumbAncestors(toCanonicalAdminPath(route.path)).map((level) => ({
    label: t(level.labelKey),
    to: localePath(level.to),
  }))
)

const items = computed<BreadcrumbItem[]>(() => [
  ...ancestors.value,
  { label: props.current, 'aria-current': 'page' },
])

const parent = computed(() => ancestors.value.at(-1) ?? null)
</script>

<template>
  <div
    v-if="parent"
    class="border-default flex min-h-10 shrink-0 items-center border-b px-4 sm:px-6"
  >
    <UBreadcrumb
      :items="items"
      class="hidden min-w-0 lg:flex"
      :aria-label="t('admin.layout.breadcrumbLabel')"
      :ui="{ link: 'text-sm', linkLabel: 'truncate max-w-[24ch]' }"
    />
    <nav class="flex min-w-0 lg:hidden" :aria-label="t('admin.layout.breadcrumbLabel')">
      <ULink
        :to="parent.to"
        class="text-muted hover:text-default -my-2 flex min-h-11 min-w-0 items-center gap-1 text-sm font-medium transition-colors"
        :aria-label="t('admin.layout.backTo', { label: parent.label })"
      >
        <UIcon name="i-tabler-chevron-left" class="size-5 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ parent.label }}</span>
      </ULink>
    </nav>
  </div>
</template>
