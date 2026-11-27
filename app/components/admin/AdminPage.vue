<script setup lang="ts">
/**
 * The anatomy every admin page shares, inside the admin layout's dashboard group:
 *
 * - a navbar that never scrolls, with the phone's menu button, the sidebar fold button, the page
 *   title (the page's only `<h1>`) and its main actions (`#actions`: one or two, the rest in a
 *   «Más» menu; their labels become screen-reader-only below `sm`);
 * - the breadcrumb row, when the page sits under another level (AdminShellBreadcrumbs);
 * - an optional toolbar (`#toolbar`, `#toolbar-right`) for search, filters and a result count;
 * - the body, which is the only thing that scrolls: an optional one-line `description`, then the
 *   default slot.
 *
 * The document title follows `title` (the layout's template adds « | Admin CREUP»). Pass
 * `breadcrumb` when the trail should name the page differently from its navbar.
 */
const props = defineProps<{
  title: string
  description?: string
  breadcrumb?: string
  /** Stable id for the panel; defaults to one derived from the route. */
  panelId?: string
}>()

const slots = defineSlots<{
  default?: () => unknown
  /** Replaces `description` when the line needs markup (a `<code>`, a link). */
  description?: () => unknown
  actions?: () => unknown
  toolbar?: () => unknown
  'toolbar-right'?: () => unknown
}>()

const route = useRoute()

const id = computed(
  () =>
    props.panelId ??
    `admin-${String(route.name ?? 'page')
      .replace(/___.*$/, '')
      .replace(/[^a-z0-9-]+/gi, '-')}`
)

useHead({ title: () => props.title })
</script>

<template>
  <UDashboardPanel :id="id">
    <template #header>
      <UDashboardNavbar :title="props.title" :ui="{ title: 'truncate' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template v-if="slots.actions" #right>
          <slot name="actions" />
        </template>
      </UDashboardNavbar>

      <AdminShellBreadcrumbs :current="props.breadcrumb ?? props.title" />

      <UDashboardToolbar
        v-if="slots.toolbar || slots['toolbar-right']"
        :ui="{ left: 'min-w-0 flex-1' }"
      >
        <template #left>
          <div class="flex w-full min-w-0 flex-wrap items-center gap-2 py-2">
            <slot name="toolbar" />
          </div>
        </template>
        <!-- Phones keep the row for the filters; the count is a nicety there. -->
        <template v-if="slots['toolbar-right']" #right>
          <div class="hidden items-center gap-2 sm:flex">
            <slot name="toolbar-right" />
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <p v-if="slots.description || props.description" class="text-muted -mb-2 text-sm">
        <slot name="description">{{ props.description }}</slot>
      </p>
      <slot />
    </template>
  </UDashboardPanel>
</template>
