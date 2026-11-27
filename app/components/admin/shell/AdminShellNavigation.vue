<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import {
  ADMIN_NAV_GROUPS,
  ADMIN_SECTION_DEFINITIONS,
  type AdminSectionDefinition,
} from '~~/shared/constants/adminSections'
import { matchAdminSection, toCanonicalAdminPath } from '~/utils/adminNavigation'

/**
 * Admin sidebar navigation: «Inicio», then one labelled group per `ADMIN_NAV_GROUPS` entry built
 * from `ADMIN_SECTION_DEFINITIONS`. Sections marked `envOnly` show only to env admins.
 *
 * A section with sub-pages is a link to its landing page; while the route is inside the section its
 * sub-pages follow it as indented links (folded, as icons named «Section · Sub-page»). They are
 * plain links rather than an accordion: Nuxt UI 4.8 renders a linked item's chevron as a nested
 * non-focusable trigger, which keyboard users cannot reach and axe rejects.
 *
 * Folded, the theme hides every label, so each link takes it as its accessible name.
 */
const props = defineProps<{ collapsed?: boolean }>()

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const adminIsEnvAdmin = useState<boolean>('admin-is-env-admin', () => false)

const canonicalPath = computed(() => toCanonicalAdminPath(route.path))
const activeMatch = computed(() => matchAdminSection(canonicalPath.value))

const named = (item: NavigationMenuItem): NavigationMenuItem =>
  props.collapsed && typeof item.label === 'string'
    ? { ...item, 'aria-label': item['aria-label'] ?? item.label }
    : item

const homeItems = computed<NavigationMenuItem[]>(() => [
  named({
    label: t('admin.nav.dashboard.name'),
    icon: 'i-tabler-home',
    to: localePath(ADMIN_ROUTES.dashboard),
    active: canonicalPath.value.replace(/\/+$/, '') === ADMIN_ROUTES.dashboard,
  }),
])

function sectionItems(section: AdminSectionDefinition): NavigationMenuItem[] {
  const isActiveSection = activeMatch.value?.section.key === section.key
  const label = t(`admin.nav.${section.key}.name`)

  if (!section.children?.length) {
    return [
      named({ label, icon: section.icon, to: localePath(section.to), active: isActiveSection }),
    ]
  }

  if (!isActiveSection) {
    return [named({ label, icon: section.icon, to: localePath(section.to), active: false })]
  }

  return [
    named({ label, icon: section.icon, to: localePath(section.to), active: false }),
    ...section.children.map((child) => {
      const childLabel = t(`admin.nav.${child.key}.name`)
      return named({
        label: props.collapsed ? `${label} · ${childLabel}` : childLabel,
        icon: child.icon,
        to: localePath(child.to),
        active: activeMatch.value?.child?.key === child.key,
        ui: props.collapsed ? undefined : { link: 'ps-6', linkLeadingIcon: 'size-4' },
      })
    }),
  ]
}

const groups = computed(() =>
  ADMIN_NAV_GROUPS.map((group) => {
    const sections = ADMIN_SECTION_DEFINITIONS.filter(
      (section) => section.group === group && (!section.envOnly || adminIsEnvAdmin.value)
    )
    const label = t(`admin.nav.groups.${group}`)
    const items: NavigationMenuItem[] = [
      { type: 'label', label },
      ...sections.flatMap(sectionItems),
    ]
    return { key: group, label, items: sections.length > 0 ? items : [] }
  }).filter((group) => group.items.length > 0)
)

const menuUi = {
  link: 'min-h-9',
  linkLeadingIcon: 'size-5',
  linkTrailing: 'shrink-0',
  label: 'pt-3 text-xs uppercase tracking-wide text-muted truncate',
}
</script>

<template>
  <!-- Each menu is its own navigation landmark, named after its group. -->
  <div
    id="admin-main-navigation"
    tabindex="-1"
    class="flex flex-1 flex-col gap-2 focus:outline-none"
  >
    <UNavigationMenu
      :items="homeItems"
      orientation="vertical"
      :collapsed="props.collapsed"
      tooltip
      :ui="menuUi"
      :aria-label="t('admin.layout.mainNavLabel')"
    />

    <div v-for="group in groups" :key="group.key" class="flex flex-col gap-2">
      <USeparator v-if="props.collapsed" class="px-2" />
      <UNavigationMenu
        :items="group.items"
        orientation="vertical"
        :collapsed="props.collapsed"
        tooltip
        :ui="menuUi"
        :aria-label="group.label"
      />
    </div>
  </div>
</template>
