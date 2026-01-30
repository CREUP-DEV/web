<script setup lang="ts">
/**
 * Admin Layout
 * Layout for admin panel pages with sidebar navigation
 */
import type { Locale } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

const { session, signOut } = useAuth()

const { locale, setLocale } = useI18n()
const { defaultLocale } = useLocales()

if (locale.value !== defaultLocale) {
  await setLocale(defaultLocale as Locale)
}

const navigation = [
  { name: 'Panel', to: '/admin', icon: 'i-tabler-layout-dashboard' },
  { name: 'Carrusel', to: '/admin/carousel', icon: 'i-tabler-photo' },
  { name: 'Noticias', to: '/admin/news', icon: 'i-tabler-news' },
  { name: 'Enlaces', to: '/admin/links', icon: 'i-tabler-link' },
  { name: 'Etiquetas', to: '/admin/tags', icon: 'i-tabler-tags' },
]

const sidebarOpen = ref(false)
</script>

<template>
  <div class="bg-background min-h-screen">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 lg:translate-x-0 dark:bg-gray-900',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center justify-between border-b px-4">
        <NuxtLink to="/admin" class="flex items-center gap-2">
          <span class="text-lg font-bold">Administración</span>
        </NuxtLink>
        <UButton icon="i-tabler-x" variant="ghost" class="lg:hidden" @click="sidebarOpen = false" />
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 overflow-y-auto p-4">
        <NuxtLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="text-foreground/70 hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
          active-class="!bg-primary/10 !text-primary"
          @click="sidebarOpen = false"
        >
          <UIcon :name="item.icon" class="size-5" />
          <span>{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <!-- User info -->
      <div class="border-t p-4">
        <div class="flex items-center gap-3">
          <img
            v-if="session.data?.user?.image"
            :src="session.data.user.image"
            alt="Avatar"
            class="size-8 rounded-full text-xs"
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

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top bar -->
      <header
        class="bg-surface/80 sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 backdrop-blur"
      >
        <UButton
          icon="i-tabler-menu"
          variant="ghost"
          class="lg:hidden"
          @click="sidebarOpen = true"
        />
        <div class="flex-1" />

        <UColorModeButton />

        <UButton to="/" icon="i-tabler-external-link" variant="ghost" color="neutral">
          Ver sitio
        </UButton>
      </header>

      <!-- Page content -->
      <main class="p-4 sm:p-6 lg:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>
