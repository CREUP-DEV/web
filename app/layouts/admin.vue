<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useMediaQuery } from '@vueuse/core'
import { useAuth } from '@/composables/useAuth'
import { getInitials } from '@/utils/initials'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { ADMIN_SECTION_DEFINITIONS } from '~~/shared/constants/adminSections'

const { session, signOut } = useAuth()
const localePath = useLocalePath()
const publicSitePath = computed(() => localePath('/'))

const route = useRoute()
const isMobileSidebar = useMediaQuery('(max-width: 1023px)')
const sidebarOpen = useState('admin-sidebar-open', () => true)
const adminIsEnvAdmin = useState<boolean>('admin-is-env-admin', () => false)

const avatarLoadFailed = ref(false)
const adminInitials = computed(() => {
  const source =
    session.value.data?.user?.name?.trim() ||
    session.value.data?.user?.email?.trim() ||
    'Administración'
  return getInitials(source)
})

const navigationCollapsed = computed(() => !sidebarOpen.value && !isMobileSidebar.value)
const toggleSidebarIcon = computed(() => {
  if (isMobileSidebar.value) {
    return 'i-tabler-menu-2'
  }

  return sidebarOpen.value
    ? 'i-tabler-layout-sidebar-left-collapse'
    : 'i-tabler-layout-sidebar-left-expand'
})

watch(
  () => session.value.data?.user?.image,
  () => {
    avatarLoadFailed.value = false
  }
)

const isNavItemActive = (to: string) => {
  if (to === ADMIN_ROUTES.dashboard) return route.path === ADMIN_ROUTES.dashboard
  return route.path === to || route.path.startsWith(`${to}/`)
}

const visibleAdminSections = computed(() =>
  ADMIN_SECTION_DEFINITIONS.filter((item) => !item.envOnly || adminIsEnvAdmin.value)
)

const allNavItems = computed(() => [
  { label: 'Panel', to: ADMIN_ROUTES.dashboard },
  ...visibleAdminSections.value.map((item) => ({ label: item.name, to: item.to })),
])

const currentPageLabel = computed(
  () => allNavItems.value.find((item) => isNavItemActive(item.to))?.label
)

const navigationItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: 'Panel',
      to: ADMIN_ROUTES.dashboard,
      icon: 'i-tabler-home',
      active: isNavItemActive(ADMIN_ROUTES.dashboard),
      onSelect: () => {
        if (isMobileSidebar.value) {
          sidebarOpen.value = false
        }
      },
    },
    ...visibleAdminSections.value.map((item) => ({
      label: item.name,
      to: item.to,
      icon: item.icon,
      active: isNavItemActive(item.to),
      onSelect: () => {
        if (isMobileSidebar.value) {
          sidebarOpen.value = false
        }
      },
    })),
  ],
])

const toggleSidebarLabel = computed(() =>
  sidebarOpen.value ? 'Contraer menú lateral' : 'Expandir menú lateral'
)

useHead({
  htmlAttrs: {
    lang: 'es',
  },
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} | Admin CREUP` : 'Admin CREUP'),
})
</script>

<template>
  <div class="bg-background min-h-screen">
    <a
      href="#admin-main-navigation"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
    >
      Ir al menú principal
    </a>
    <a
      href="#admin-main-content"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-48"
    >
      Ir al contenido principal
    </a>

    <div class="flex min-h-screen">
      <USidebar
        v-model:open="sidebarOpen"
        collapsible="icon"
        mode="slideover"
        :ui="{
          root: '[--sidebar-width-icon:4.75rem] transition-[width] duration-300 ease-in-out',
          container: 'h-full',
        }"
      >
        <template #header="{ state, close }">
          <div
            :class="[
              'relative flex w-full overflow-visible',
              state === 'expanded' ? 'items-start gap-3 pr-10' : 'items-center justify-center',
            ]"
          >
            <div
              :class="[
                'flex items-center',
                state === 'expanded' ? 'min-w-0 gap-3 overflow-hidden' : 'w-full justify-center',
              ]"
            >
              <div
                class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
              >
                <UIcon name="i-tabler-layout-dashboard" class="size-5" />
              </div>

              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-x-1"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 -translate-x-1"
              >
                <div v-if="state === 'expanded'" class="min-w-0">
                  <p class="truncate text-sm font-semibold">Administración</p>
                </div>
              </Transition>
            </div>

            <UButton
              icon="i-tabler-x"
              variant="ghost"
              class="absolute top-0 -right-1 shrink-0 lg:hidden"
              aria-label="Cerrar menú lateral"
              @click="close"
            />
          </div>
        </template>

        <nav id="admin-main-navigation" tabindex="-1" aria-label="Navegación principal">
          <UNavigationMenu
            :items="navigationItems"
            orientation="vertical"
            :collapsed="navigationCollapsed"
            :tooltip="{ delayDuration: 0, content: { side: 'right' } }"
            :ui="{
              link: 'h-11 px-2.5 text-sm overflow-hidden',
              linkLeadingIcon: 'size-5 shrink-0',
              linkLabel: 'truncate',
            }"
          />
        </nav>

        <template #footer="{ state }">
          <ClientOnly>
            <div
              :class="[
                'flex w-full items-center overflow-hidden',
                state === 'expanded' ? 'gap-3' : 'justify-center',
              ]"
            >
              <img
                v-if="session.data?.user?.image && !avatarLoadFailed"
                :src="session.data.user.image"
                :alt="
                  session.data.user.name
                    ? `Avatar de ${session.data.user.name}`
                    : 'Avatar de usuario'
                "
                class="size-8 shrink-0 rounded-full text-xs"
                loading="eager"
                decoding="async"
                @error="avatarLoadFailed = true"
              />
              <div
                v-else
                class="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                aria-hidden="true"
              >
                {{ adminInitials }}
              </div>

              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-x-1"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 -translate-x-1"
              >
                <div v-if="state === 'expanded'" class="flex min-w-0 flex-1 items-center gap-1">
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-2 text-sm leading-tight font-medium">
                      {{ session.data?.user?.name || 'Administración' }}
                    </p>
                    <p class="text-muted truncate text-xs">{{ session.data?.user?.email }}</p>
                  </div>

                  <UButton
                    icon="i-tabler-logout"
                    variant="ghost"
                    class="shrink-0"
                    size="sm"
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    @click="signOut"
                  />
                </div>
              </Transition>
            </div>

            <template #fallback>
              <div
                :class="[
                  'flex w-full items-center overflow-hidden',
                  state === 'expanded' ? 'gap-3' : 'justify-center',
                ]"
              >
                <div class="bg-muted size-8 shrink-0 rounded-full" aria-hidden="true" />
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-x-1"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100 translate-x-0"
                  leave-to-class="opacity-0 -translate-x-1"
                >
                  <div v-if="state === 'expanded'" class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">Administración</p>
                    <p class="text-muted truncate text-xs">Cargando sesión...</p>
                  </div>
                </Transition>
              </div>
            </template>
          </ClientOnly>
        </template>
      </USidebar>

      <div
        class="bg-default flex min-w-0 flex-1 flex-col overflow-hidden transition-[width] duration-300 ease-in-out"
      >
        <header
          class="border-default flex h-(--ui-header-height) shrink-0 items-center gap-3 border-b px-4"
        >
          <UButton
            :icon="toggleSidebarIcon"
            color="neutral"
            variant="ghost"
            class="shrink-0"
            :aria-label="toggleSidebarLabel"
            :title="toggleSidebarLabel"
            @click="sidebarOpen = !sidebarOpen"
          />

          <Transition
            mode="out-in"
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div v-if="currentPageLabel" :key="currentPageLabel" class="flex items-center gap-3">
              <USeparator orientation="vertical" class="h-5" />
              <p class="text-sm font-semibold">{{ currentPageLabel }}</p>
            </div>
          </Transition>

          <div class="flex-1" />

          <UColorModeButton />

          <UButton
            :to="publicSitePath"
            icon="i-tabler-external-link"
            variant="ghost"
            color="neutral"
            size="sm"
          >
            Ver sitio
          </UButton>
        </header>

        <main id="admin-main-content" tabindex="-1" class="flex-1 p-4 sm:p-6 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
