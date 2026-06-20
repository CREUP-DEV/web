<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import type { Locale } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { useAuth } from '@/composables/security/useAuth'
import { getInitials } from '@/utils/initials'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { ADMIN_SECTION_DEFINITIONS } from '~~/shared/constants/adminSections'

const { session, signOut } = useAuth()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { localeConfigs, getLocaleFlag, getLocaleName, getLanguageTag } = useLocales()
const publicSitePath = computed(() => localePath('/'))

const route = useRoute()

const localeItems = computed(() =>
  localeConfigs.value.map((config) => ({
    value: config.code,
    label: getLocaleName(config.code),
    icon: config.flag,
  }))
)

const selectedLocale = computed({
  get: () => locale.value,
  set: (newLocale: string) => {
    if (!newLocale || newLocale === locale.value) {
      return
    }
    // Admin routes are localized (prefix_except_default), so switching = navigating to the
    // prefixed/unprefixed path. Persistence lives in the URL — no cookie needed.
    const targetPath = switchLocalePath(newLocale as Locale)
    if (targetPath && targetPath !== route.fullPath) {
      void navigateTo(targetPath)
    }
  },
})

const currentLocale = computed(
  () => localeItems.value.find((item) => item.value === locale.value) ?? localeItems.value[0]
)

// Mobile uses a flag-only dropdown (matching the public header) so the language control stays
// compact instead of a full-width select.
const mobileLocaleItems = computed<DropdownMenuItem[]>(() =>
  localeItems.value.map((item) => ({
    label: item.label,
    icon: item.icon,
    type: 'checkbox',
    checked: item.value === locale.value,
    onSelect: () => {
      selectedLocale.value = item.value
    },
  }))
)
const isMobileSidebar = useMediaQuery('(max-width: 1023px)')
const sidebarOpen = useState('admin-sidebar-open', () => false)
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
  const target = localePath(to)
  if (to === ADMIN_ROUTES.dashboard) return route.path === target
  return route.path === target || route.path.startsWith(`${target}/`)
}

const visibleAdminSections = computed(() =>
  ADMIN_SECTION_DEFINITIONS.filter((item) => !item.envOnly || adminIsEnvAdmin.value)
)

const allNavItems = computed(() => [
  { label: t('admin.nav.dashboard.name'), to: ADMIN_ROUTES.dashboard },
  ...visibleAdminSections.value.map((item) => ({
    label: t(`admin.nav.${item.key}.name`),
    to: item.to,
  })),
])

const currentPageLabel = computed(
  () => allNavItems.value.find((item) => isNavItemActive(item.to))?.label
)

const navigationItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t('admin.nav.dashboard.name'),
      to: localePath(ADMIN_ROUTES.dashboard),
      icon: 'i-tabler-home',
      active: isNavItemActive(ADMIN_ROUTES.dashboard),
      onSelect: () => {
        if (isMobileSidebar.value) {
          sidebarOpen.value = false
        }
      },
    },
    ...visibleAdminSections.value.map((item) => ({
      label: t(`admin.nav.${item.key}.name`),
      to: localePath(item.to),
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

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t('admin.layout.signOut'),
      icon: 'i-tabler-logout',
      onSelect: signOut,
    },
  ],
])

const toggleSidebarLabel = computed(() =>
  sidebarOpen.value ? t('admin.layout.collapseSidebar') : t('admin.layout.expandSidebar')
)

useHead({
  htmlAttrs: {
    lang: computed(() => getLanguageTag(locale.value)),
  },
  // Document title follows the active section's localized nav label (re-renders on locale switch).
  title: currentPageLabel,
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} | Admin CREUP` : 'Admin CREUP'),
})
</script>

<template>
  <div class="bg-background min-h-screen">
    <a
      href="#admin-main-navigation"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
    >
      {{ t('admin.layout.skipToNav') }}
    </a>
    <a
      href="#admin-main-content"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-48"
    >
      {{ t('admin.layout.skipToContent') }}
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
                  <p class="truncate text-sm font-semibold">{{ t('admin.layout.adminTitle') }}</p>
                </div>
              </Transition>
            </div>

            <UButton
              icon="i-tabler-x"
              variant="ghost"
              class="absolute top-0 -right-1 shrink-0 lg:hidden"
              :aria-label="t('admin.layout.closeSidebar')"
              :title="t('admin.layout.closeSidebar')"
              @click="close"
            />
          </div>
        </template>

        <nav id="admin-main-navigation" tabindex="-1" :aria-label="t('admin.layout.mainNavLabel')">
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
              <template v-if="state === 'expanded'">
                <img
                  v-if="session.data?.user?.image && !avatarLoadFailed"
                  :src="session.data.user.image"
                  :alt="
                    session.data.user.name
                      ? t('admin.layout.userAvatar', { name: session.data.user.name })
                      : t('admin.layout.userAvatarFallback')
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
                        {{ session.data?.user?.name || t('admin.layout.adminTitle') }}
                      </p>
                      <p class="text-muted truncate text-xs">{{ session.data?.user?.email }}</p>
                    </div>

                    <UButton
                      icon="i-tabler-logout"
                      variant="ghost"
                      class="shrink-0"
                      size="sm"
                      :title="t('admin.layout.signOut')"
                      :aria-label="t('admin.layout.signOut')"
                      @click="signOut"
                    />
                  </div>
                </Transition>
              </template>

              <UDropdownMenu v-else :items="userMenuItems">
                <UButton
                  variant="ghost"
                  color="neutral"
                  class="rounded-full p-0"
                  :aria-label="t('admin.layout.userMenu')"
                  :title="t('admin.layout.userMenu')"
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
                  <span
                    v-else
                    class="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    aria-hidden="true"
                  >
                    {{ adminInitials }}
                  </span>
                </UButton>
              </UDropdownMenu>
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
                    <p class="truncate text-sm font-medium">{{ t('admin.layout.adminTitle') }}</p>
                    <p class="text-muted truncate text-xs">
                      {{ t('admin.layout.loadingSession') }}
                    </p>
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
          <UTooltip :text="toggleSidebarLabel">
            <UButton
              :icon="toggleSidebarIcon"
              color="neutral"
              variant="ghost"
              class="shrink-0"
              :aria-label="toggleSidebarLabel"
              @click="sidebarOpen = !sidebarOpen"
            />
          </UTooltip>

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

          <USelect
            v-model="selectedLocale"
            :items="localeItems"
            value-key="value"
            class="hidden shrink-0 sm:block sm:w-36"
            :aria-label="t('language.toggle')"
          >
            <template #leading="{ modelValue }">
              <UIcon v-if="modelValue" :name="getLocaleFlag(modelValue)" class="size-5" />
            </template>
          </USelect>

          <UDropdownMenu :items="mobileLocaleItems" class="shrink-0 sm:hidden">
            <UButton
              :icon="currentLocale?.icon"
              color="neutral"
              variant="ghost"
              :aria-label="t('language.openMenu')"
            />
          </UDropdownMenu>

          <UColorModeButton class="shrink-0" />

          <UButton
            :to="publicSitePath"
            icon="i-tabler-external-link"
            variant="ghost"
            color="neutral"
            class="shrink-0 whitespace-nowrap"
          >
            {{ t('admin.layout.viewSite') }}
          </UButton>
        </header>

        <main id="admin-main-content" tabindex="-1" class="flex-1 p-4 sm:p-6 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
