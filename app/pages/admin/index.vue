<script setup lang="ts">
/**
 * Admin Dashboard
 */
import { useAuth } from '@/composables/useAuth'

definePageMeta({
  layout: 'admin',
})

const _auth = useAuth()

// Check auth on mount
const { data: authCheck, error: authError } = await useFetch('/api/admin/session')

// Redirect to login if not authenticated
if (authError.value || !authCheck.value) {
  navigateTo('/admin/login')
}

// Stats
const { data: carouselData } = await useFetch('/api/admin/carousel')
const { data: newsData } = await useFetch('/api/admin/news')
const { data: linksData } = await useFetch('/api/admin/links')
const { data: tagsData } = await useFetch('/api/admin/tags')
const { data: accessData } = await useFetch('/api/admin/access')

const stats = computed(() => [
  {
    name: 'Accesos',
    count: (accessData.value as { items: unknown[] })?.items?.length ?? 0,
    to: '/admin/access',
    icon: 'i-tabler-shield-lock',
  },
  {
    name: 'Carrusel',
    count: (carouselData.value as { items: unknown[] })?.items?.length ?? 0,
    to: '/admin/carousel',
    icon: 'i-tabler-photo',
  },
  {
    name: 'Noticias',
    count: (newsData.value as { items: unknown[] })?.items?.length ?? 0,
    to: '/admin/news',
    icon: 'i-tabler-news',
  },
  {
    name: 'Enlaces',
    count: (linksData.value as { items: unknown[] })?.items?.length ?? 0,
    to: '/admin/links',
    icon: 'i-tabler-link',
  },
  {
    name: 'Etiquetas',
    count: (tagsData.value as { items: unknown[] })?.items?.length ?? 0,
    to: '/admin/tags',
    icon: 'i-tabler-tags',
  },
])
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold">Panel</h1>

    <p class="text-muted mb-8">Bienvenido. Gestiona el contenido de la página de inicio.</p>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.name"
        :to="stat.to"
        class="bg-surface flex items-center gap-4 rounded-xl p-6 shadow-sm ring-1 ring-gray-200/50 transition-shadow hover:shadow-md dark:ring-gray-800/50"
      >
        <div class="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
          <UIcon :name="stat.icon" class="text-primary-600 dark:text-primary-400 size-6" />
        </div>
        <div>
          <p class="text-2xl font-bold">{{ stat.count }}</p>
          <p class="text-muted text-sm">{{ stat.name }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
