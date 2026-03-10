<script setup lang="ts">
/**
 * Admin Dashboard
 */
definePageMeta({
  layout: 'admin',
})

const { data: authCheck, error: authError } = await useFetch('/api/admin/session')

if (authError.value || !authCheck.value) {
  navigateTo('/admin/login')
}

type ContentItem = { active?: boolean }
type AccessResponse = { items: Array<{ active: boolean }>; summary?: { active: number } }
type SubscriberResponse = { items: Array<{ active: boolean }> }
type CollectionResponse<T> = { items: T[] }

const { data: carouselData } =
  await useFetch<CollectionResponse<ContentItem>>('/api/admin/carousel')
const { data: pressData } = await useFetch<CollectionResponse<ContentItem>>('/api/admin/press')
const { data: newsletterData } =
  await useFetch<CollectionResponse<ContentItem>>('/api/admin/newsletter')
const { data: linksData } = await useFetch<CollectionResponse<ContentItem>>('/api/admin/links')
const { data: tagsData } =
  await useFetch<CollectionResponse<Record<string, never>>>('/api/admin/tags')
const { data: mediaData } =
  await useFetch<CollectionResponse<Record<string, never>>>('/api/admin/media')
const { data: reportsData } = await useFetch<CollectionResponse<ContentItem>>(
  '/api/admin/financial-reports'
)
const { data: accessData } = await useFetch<AccessResponse>('/api/admin/access')
const { data: subscribersData } = await useFetch<SubscriberResponse>(
  '/api/admin/newsletter/subscribers'
)

const countActive = (items: ContentItem[] | undefined) =>
  items?.filter((item) => item.active !== false).length ?? 0

const countTotal = <T,>(items: T[] | undefined) => items?.length ?? 0

const overview = computed(() => {
  const publishedContent =
    countActive(carouselData.value?.items) +
    countActive(pressData.value?.items) +
    countActive(newsletterData.value?.items) +
    countActive(linksData.value?.items) +
    countActive(reportsData.value?.items)

  const managedRecords =
    publishedContent +
    countTotal(tagsData.value?.items) +
    countTotal(mediaData.value?.items) +
    countTotal(accessData.value?.items) +
    countTotal(subscribersData.value?.items)

  return [
    {
      name: 'Contenido publicado',
      value: publishedContent,
      description: 'Elementos activos visibles en la web.',
      icon: 'i-tabler-world-upload',
      color: 'primary' as const,
    },
    {
      name: 'Registros gestionados',
      value: managedRecords,
      description: 'Contenido, accesos, medios y suscriptores.',
      icon: 'i-tabler-database',
      color: 'neutral' as const,
    },
    {
      name: 'Administradores activos',
      value: accessData.value?.summary?.active ?? countActive(accessData.value?.items),
      description: 'Cuentas con acceso efectivo al panel.',
      icon: 'i-tabler-shield-lock',
      color: 'success' as const,
    },
    {
      name: 'Suscriptores activos',
      value: countActive(subscribersData.value?.items),
      description: 'Altas disponibles para newsletter.',
      icon: 'i-tabler-mail-check',
      color: 'info' as const,
    },
  ]
})

const sections = computed(() => [
  {
    name: 'Prensa',
    total: countTotal(pressData.value?.items),
    active: countActive(pressData.value?.items),
    description: 'Artículos, comunicados y apariciones en medios.',
    to: '/admin/press',
    icon: 'i-tabler-news',
  },
  {
    name: 'Newsletter',
    total: countTotal(newsletterData.value?.items),
    active: countActive(newsletterData.value?.items),
    description: 'Ediciones publicadas y listas para envío.',
    to: '/admin/newsletter',
    icon: 'i-tabler-mail',
  },
  {
    name: 'Carrusel',
    total: countTotal(carouselData.value?.items),
    active: countActive(carouselData.value?.items),
    description: 'Slides destacados de la portada.',
    to: '/admin/carousel',
    icon: 'i-tabler-photo',
  },
  {
    name: 'Enlaces',
    total: countTotal(linksData.value?.items),
    active: countActive(linksData.value?.items),
    description: 'Bloques destacados y accesos rápidos.',
    to: '/admin/links',
    icon: 'i-tabler-link',
  },
  {
    name: 'Informes Económicos',
    total: countTotal(reportsData.value?.items),
    active: countActive(reportsData.value?.items),
    description: 'Informes aprobados por la Asamblea General.',
    to: '/admin/financial-reports',
    icon: 'i-tabler-file-analytics',
  },
  {
    name: 'Etiquetas',
    total: countTotal(tagsData.value?.items),
    active: countTotal(tagsData.value?.items),
    description: 'Taxonomía usada para clasificar prensa.',
    to: '/admin/tags',
    icon: 'i-tabler-tags',
  },
  {
    name: 'Medios',
    total: countTotal(mediaData.value?.items),
    active: countTotal(mediaData.value?.items),
    description: 'Medios asociados a apariciones en prensa.',
    to: '/admin/media',
    icon: 'i-tabler-broadcast',
  },
  {
    name: 'Accesos',
    total: countTotal(accessData.value?.items),
    active: accessData.value?.summary?.active ?? countActive(accessData.value?.items),
    description: 'Personas autorizadas para entrar al panel.',
    to: '/admin/access',
    icon: 'i-tabler-shield-lock',
  },
])

const quickActions = [
  {
    label: 'Nuevo artículo',
    to: '/admin/press/create',
    icon: 'i-tabler-pencil-plus',
  },
  {
    label: 'Nueva newsletter',
    to: '/admin/newsletter',
    icon: 'i-tabler-mail-plus',
  },
  {
    label: 'Nuevo informe económico',
    to: '/admin/financial-reports',
    icon: 'i-tabler-file-plus',
  },
]
</script>

<template>
  <div class="space-y-8">
    <section class="overflow-hidden rounded-2xl border">
      <div class="from-primary/10 via-primary/5 to-background bg-gradient-to-br p-6 sm:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-primary mb-2 text-sm font-semibold tracking-wide uppercase">
              Panel de administración
            </p>
            <h1 class="text-2xl font-bold sm:text-3xl">Resumen general</h1>
            <p class="text-muted mt-3 text-sm sm:text-base">
              Consulta el estado del contenido publicado y accede rápido a las secciones que más se
              actualizan.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              :icon="action.icon"
              color="neutral"
              variant="outline"
            >
              {{ action.label }}
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard v-for="item in overview" :key="item.name">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-muted text-sm">{{ item.name }}</p>
            <p class="mt-2 text-3xl font-bold">{{ item.value }}</p>
            <p class="text-muted mt-2 text-sm">{{ item.description }}</p>
          </div>
          <div class="rounded-xl border p-3">
            <UIcon :name="item.icon" class="size-6" />
          </div>
        </div>
      </UCard>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-lg font-bold">Secciones</h2>
        <p class="text-muted text-sm">Recuento de elementos totales y activos por área.</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <NuxtLink v-for="section in sections" :key="section.to" :to="section.to" class="group">
          <UCard class="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
            <div class="flex items-start gap-4">
              <div class="bg-muted rounded-xl p-3">
                <UIcon :name="section.icon" class="text-primary size-6" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="font-semibold">{{ section.name }}</h3>
                    <p class="text-muted mt-1 text-sm">{{ section.description }}</p>
                  </div>
                  <UIcon
                    name="i-tabler-arrow-up-right"
                    class="text-muted size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <UBadge color="neutral" variant="subtle" size="sm">
                    {{ section.total }} totales
                  </UBadge>
                  <UBadge color="success" variant="subtle" size="sm">
                    {{ section.active }} activos
                  </UBadge>
                </div>
              </div>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
