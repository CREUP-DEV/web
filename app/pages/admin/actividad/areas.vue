<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

definePageMeta({
  layout: 'admin',
  title: 'Áreas de informes',
})

const { t } = useI18n()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()
const { formatDateTime } = useLocaleFormatting()
const { getTranslation } = useLocales()

interface AreaCatalogArea {
  id: string
  selectionKey: number
  nameTranslations: Record<string, string>
  order: number
  lastSyncedAt: string | null
}

interface AreaCatalogMandate {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
  areas: AreaCatalogArea[]
}

interface CatalogSyncMeta {
  lastSuccessAt: string | null
  lastFailureAt: string | null
  lastErrorMessage: string | null
}

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{ data: AreaCatalogMandate[]; meta: CatalogSyncMeta }>(
  '/api/admin/area-catalog',
  { headers: localeApiHeaders, default: () => ({ data: [], meta: {} as CatalogSyncMeta }) }
)

const mandates = computed(() => data.value?.data ?? [])

// A failure only matters while it is the most recent outcome; an older one followed by a success
// is just history.
const syncFailedRecently = computed(() => {
  const meta = data.value?.meta
  if (!meta?.lastFailureAt) return false
  if (!meta.lastSuccessAt) return true
  return meta.lastFailureAt > meta.lastSuccessAt
})

const { locale } = useI18n()
const areaName = (area: AreaCatalogArea) =>
  getTranslation(
    Object.entries(area.nameTranslations).map(([code, name]) => ({ locale: code, name })),
    locale.value
  )?.name ?? Object.values(area.nameTranslations)[0]

const formatDate = (iso: string | null) =>
  iso ? formatDateTime(iso, { dateStyle: 'medium' }) : t('admin.areaCatalog.neverSynced')

const mandateRange = (mandate: AreaCatalogMandate) =>
  mandate.endDate
    ? `${formatDate(mandate.startDate)} – ${formatDate(mandate.endDate)}`
    : t('admin.areaCatalog.mandateOngoing', { start: formatDate(mandate.startDate) })
</script>

<template>
  <div>
    <UButton
      :to="localePath(ADMIN_ROUTES.activityReports)"
      variant="ghost"
      icon="i-tabler-arrow-left"
      size="sm"
      class="mb-3"
    >
      {{ t('admin.common.back') }}
    </UButton>

    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ t('admin.areaCatalog.title') }}</h1>
      <p class="text-muted mt-1 text-sm">{{ t('admin.areaCatalog.subheading') }}</p>
    </div>

    <UAlert
      v-if="syncFailedRecently"
      class="mb-6"
      color="warning"
      variant="soft"
      icon="i-tabler-alert-triangle"
      :title="t('admin.areaCatalog.syncFailedBanner')"
      :description="
        t('admin.areaCatalog.syncFailedSince', { date: formatDate(data.meta.lastFailureAt) })
      "
    />

    <div v-if="pending" class="space-y-3">
      <USkeleton class="h-32 w-full rounded-xl" />
      <USkeleton class="h-32 w-full rounded-xl" />
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.areaCatalog.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else class="space-y-6">
      <section
        v-for="mandate in mandates"
        :key="mandate.id"
        class="ring-default rounded-xl p-5 ring-1"
        :class="mandate.isCurrent ? 'border-primary/30 bg-primary/5' : ''"
      >
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <h2 class="text-lg font-bold">{{ mandateRange(mandate) }}</h2>
          <UBadge v-if="mandate.isCurrent" variant="subtle" color="primary" size="sm">
            {{ t('admin.areaCatalog.currentMandateBadge') }}
          </UBadge>
        </div>

        <ol class="space-y-2">
          <li
            v-for="area in mandate.areas"
            :key="area.id"
            class="bg-surface ring-default flex items-center gap-3 rounded-lg p-3 ring-1"
          >
            <span class="text-muted w-6 shrink-0 text-center text-sm tabular-nums">
              {{ area.order }}
            </span>
            <span class="min-w-0 flex-1 font-medium">{{ areaName(area) }}</span>
            <span class="text-dimmed shrink-0 text-xs">
              {{ t('admin.areaCatalog.lastSyncedLabel') }}: {{ formatDate(area.lastSyncedAt) }}
            </span>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
