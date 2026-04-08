<script setup lang="ts">
import type { Locale } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { ADMIN_SECTION_DEFINITIONS } from '~~/shared/constants/adminSections'

const { session, signOut } = useAuth()

// Admin is always in the default locale (Spanish). Force it on first mount.
const { setLocale } = useI18n()
const { defaultLocale } = useLocales()
await setLocale(defaultLocale as Locale)

const route = useRoute()

const navigation = [
  { name: 'Panel', to: '/admin', icon: 'i-tabler-layout-dashboard' },
  ...ADMIN_SECTION_DEFINITIONS,
]

const isNavItemActive = (to: string) => {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(to + '/')
}

useHead({
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} | Admin CREUP` : 'Admin CREUP'),
})

// Persist sidebar state across admin page navigations.
const sidebarOpen = useState('admin-sidebar-open', () => false)
</script>

<template>
  <div class="bg-background min-h-screen">
    <a
      href="#admin-main-content"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
    >
      Saltar al contenido principal
    </a>

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />

    <aside
      aria-label="Navegación de administración"
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 lg:translate-x-0 dark:bg-gray-900',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex h-16 items-center justify-between border-b px-4">
        <NuxtLink to="/admin" class="flex items-center gap-2">
          <span class="text-lg font-bold">Administración</span>
        </NuxtLink>
        <UButton
          icon="i-tabler-x"
          variant="ghost"
          class="lg:hidden"
          aria-label="Cerrar menú lateral"
          @click="sidebarOpen = false"
        />
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Secciones de administración">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="text-foreground/70 hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
          :class="{ '!bg-primary/10 !text-primary': isNavItemActive(item.to) }"
          @click="sidebarOpen = false"
        >
          <UIcon :name="item.icon" class="size-5" />
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t p-4">
        <div class="flex items-center gap-3">
          <img
            v-if="session.data?.user?.image"
            :src="session.data.user.image"
            :alt="
              session.data.user.name ? `Avatar de ${session.data.user.name}` : 'Avatar de usuario'
            "
            class="size-8 rounded-full text-xs"
            loading="eager"
            decoding="async"
          />
          <div class="flex-1 truncate">
            <p class="truncate text-sm font-medium">{{ session.data?.user?.name }}</p>
            <p class="text-muted truncate text-xs">{{ session.data?.user?.email }}</p>
          </div>
          <UButton
            icon="i-tabler-logout"
            variant="ghost"
            size="sm"
            title="Cerrar sesión"
            @click="signOut"
          />
        </div>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header
        class="bg-surface/80 sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 backdrop-blur"
      >
        <UButton
          icon="i-tabler-menu"
          variant="ghost"
          class="lg:hidden"
          aria-label="Abrir menú lateral"
          @click="sidebarOpen = true"
        />
        <div class="flex-1" />

        <UColorModeButton />

        <UButton to="/" icon="i-tabler-external-link" variant="ghost" color="neutral">
          Ver sitio
        </UButton>
      </header>

      <main id="admin-main-content" tabindex="-1" class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
