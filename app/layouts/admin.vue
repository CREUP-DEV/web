<script setup lang="ts">
/**
 * Admin dashboard shell. Every admin page renders its own AdminPage (a UDashboardPanel with its
 * navbar, breadcrumbs and toolbar) directly inside <main>, so the navbar stays in view and only
 * the panel body scrolls. Previews (`vista-previa`) use the public layout and the login page none.
 *
 * The sidebar holds the brand, the grouped navigation (AdminShellNavigation) and the account menu
 * with the public site, preferences and sign out (AdminShellUserMenu). Folded and dragged sizes
 * persist in the `admin-dashboard-sidebar-admin` cookie, so the server renders the sidebar as it was left; on
 * phones it is a drawer that closes on navigation.
 */
const { t } = useI18n()

const sidebarOpen = useState<boolean>('admin-sidebar-open', () => false)

useHead({
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} | Admin CREUP` : 'Admin CREUP'),
})
</script>

<template>
  <div>
    <!-- From lg only: below it the navigation is a closed drawer, which a link cannot focus. -->
    <a
      href="#admin-main-navigation"
      class="bg-primary text-inverted sr-only rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 max-lg:hidden"
    >
      {{ t('admin.layout.skipToNav') }}
    </a>
    <a
      href="#admin-main-content"
      class="bg-primary text-inverted sr-only rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50"
    >
      {{ t('admin.layout.skipToContent') }}
    </a>

    <UDashboardGroup storage-key="admin-dashboard">
      <!-- Unfolded it never goes below 15rem, where the longest group and section names still fit,
           nor past 18rem on a wide screen. Its size is a share of the group (8% to 30%), wide
           enough that the rem clamp is the only bound on common screens. -->
      <UDashboardSidebar
        id="admin"
        v-model:open="sidebarOpen"
        collapsible
        resizable
        :default-size="18"
        :min-size="8"
        :max-size="30"
        class="lg:data-[collapsed=false]:max-w-72 lg:data-[collapsed=false]:min-w-60"
        :ui="{ footer: 'lg:border-t lg:border-default' }"
        :menu="{
          title: t('admin.layout.sidebarTitle'),
          description: t('admin.layout.sidebarDescription'),
        }"
      >
        <template #header="{ collapsed }">
          <AdminShellBrand :collapsed="collapsed" />
        </template>

        <template #default="{ collapsed }">
          <AdminShellNavigation :collapsed="collapsed" />
        </template>

        <template #footer="{ collapsed }">
          <AdminShellUserMenu :collapsed="collapsed" />
        </template>
      </UDashboardSidebar>

      <main
        id="admin-main-content"
        tabindex="-1"
        class="flex min-w-0 flex-1 overflow-y-auto focus:outline-none"
      >
        <slot />
      </main>
    </UDashboardGroup>

    <AdminShellPreferencesDialog />
  </div>
</template>
