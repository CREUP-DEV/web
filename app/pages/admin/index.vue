<script setup lang="ts">
import type { AdminSectionKey } from '~~/shared/constants/adminSections'
import { ADMIN_SECTION_DEFINITIONS } from '~~/shared/constants/adminSections'

definePageMeta({
  layout: 'admin',
  title: 'Inicio',
})

interface DashboardRecentActivityItem {
  sectionKey: AdminSectionKey
  title: string
  description: string
  to: string
  updatedAt: string
}

interface AdminSummaryResponse {
  subscribers: {
    total: number
    active: number
  }
  recentActivity: DashboardRecentActivityItem[]
}

interface DashboardAction {
  title: string
  to: string
  icon: string
}

const {
  data: summaryData,
  pending: summaryPending,
  error: summaryError,
  refresh: refreshSummary,
} = await useFetch<AdminSummaryResponse>('/api/admin/summary')
const { formatDateTime } = useLocaleFormatting()

const sectionByKey = Object.fromEntries(
  ADMIN_SECTION_DEFINITIONS.map((section) => [section.key, section] as const)
) as Record<AdminSectionKey, (typeof ADMIN_SECTION_DEFINITIONS)[number]>

const recentActivity = computed(() => summaryData.value?.recentActivity ?? [])
const subscribers = computed(() => summaryData.value?.subscribers ?? { total: 0, active: 0 })

const primaryActions: DashboardAction[] = [
  {
    title: 'Nueva nota de prensa',
    to: '/admin/press/create?type=press_release',
    icon: 'i-tabler-writing-sign',
  },
  {
    title: 'Nuevo comunicado',
    to: '/admin/press/create?type=statement',
    icon: 'i-tabler-speakerphone',
  },
  {
    title: 'Añadir aparición en medios',
    to: '/admin/press/create?type=media_appearance',
    icon: 'i-tabler-broadcast',
  },
]

const getSectionMeta = (key: AdminSectionKey) => sectionByKey[key]

const formatActivityDate = (value: string) =>
  formatDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
</script>

<template>
  <div class="space-y-6">
    <template v-if="summaryPending">
      <section
        class="from-primary/10 to-warning/10 overflow-hidden rounded-3xl border bg-linear-to-br via-transparent"
      >
        <div class="space-y-4 p-5 sm:p-6">
          <USkeleton class="h-9 w-56" />
          <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-[17rem_repeat(3,minmax(0,1fr))]">
            <USkeleton class="h-40 rounded-2xl" />
            <USkeleton class="h-32 rounded-2xl" />
            <USkeleton class="h-32 rounded-2xl" />
            <USkeleton class="h-32 rounded-2xl" />
          </div>
        </div>
      </section>

      <UCard>
        <div class="space-y-4">
          <USkeleton class="h-7 w-52" />
          <USkeleton class="h-5 w-72" />
          <USkeleton class="h-18 rounded-2xl" />
          <USkeleton class="h-18 rounded-2xl" />
        </div>
      </UCard>
    </template>

    <div v-else-if="summaryError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudo cargar el resumen del panel"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refreshSummary()">
        Reintentar
      </UButton>
    </div>

    <template v-else>
      <section
        class="from-primary/10 to-warning/10 overflow-hidden rounded-3xl border bg-linear-to-br via-transparent"
      >
        <div class="space-y-4 p-5 sm:p-6">
          <h1 class="text-2xl font-semibold sm:text-3xl">Acciones rápidas</h1>

          <div class="grid gap-3 lg:grid-cols-2 xl:grid-cols-[17rem_repeat(3,minmax(0,1fr))]">
            <div class="bg-background/80 flex h-full flex-col rounded-2xl border p-4 shadow-sm">
              <p class="text-muted text-sm">Newsletter</p>
              <div class="mt-3">
                <p class="text-2xl font-semibold sm:text-3xl">{{ subscribers.total }}</p>
                <p class="text-muted text-sm">suscriptores</p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <UButton to="/admin/newsletter?open=create" size="sm">Nueva newsletter</UButton>
                <UButton
                  to="/admin/newsletter/subscribers"
                  variant="outline"
                  color="neutral"
                  size="sm"
                >
                  Ver suscriptores
                </UButton>
              </div>
            </div>

            <NuxtLink
              v-for="action in primaryActions"
              :key="action.to"
              :to="action.to"
              class="group bg-background/80 flex min-h-32 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div class="flex h-full flex-col">
                <div
                  class="bg-muted text-primary mb-4 flex size-10 items-center justify-center rounded-xl"
                >
                  <UIcon :name="action.icon" class="size-5" />
                </div>
                <h2 class="text-lg leading-snug font-semibold">{{ action.title }}</h2>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <UCard>
        <div class="space-y-4">
          <div>
            <h2 class="text-lg font-semibold">Actividad reciente</h2>
            <p class="text-muted mt-1 text-sm">Lo último que se ha tocado en el panel.</p>
          </div>

          <div v-if="recentActivity.length" class="space-y-3">
            <NuxtLink
              v-for="item in recentActivity"
              :key="`${item.sectionKey}-${item.updatedAt}-${item.title}`"
              :to="item.to"
              class="group hover:border-primary/40 hover:bg-primary/5 block rounded-2xl border p-4 transition"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-start gap-3">
                  <div
                    class="bg-muted text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
                  >
                    <UIcon :name="getSectionMeta(item.sectionKey).icon" class="size-5" />
                  </div>

                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="truncate font-medium">{{ item.title }}</h3>
                      <UBadge color="neutral" variant="subtle" size="sm">
                        {{ getSectionMeta(item.sectionKey).name }}
                      </UBadge>
                    </div>
                    <p class="text-muted mt-1 text-sm leading-5">{{ item.description }}</p>
                  </div>
                </div>

                <div class="flex shrink-0 items-center gap-3 self-start lg:self-auto">
                  <p class="text-muted text-xs sm:text-sm">
                    {{ formatActivityDate(item.updatedAt) }}
                  </p>
                  <UIcon
                    name="i-tabler-arrow-up-right"
                    class="text-muted group-hover:text-primary size-4 transition"
                  />
                </div>
              </div>
            </NuxtLink>
          </div>

          <div v-else class="rounded-2xl border px-4 py-10 text-center text-sm">
            <p class="text-muted">Todavía no hay actividad reciente que mostrar.</p>
            <UButton
              to="/admin/press/create?type=press_release"
              size="sm"
              icon="i-tabler-plus"
              class="mt-4"
            >
              Crear nota de prensa
            </UButton>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>
