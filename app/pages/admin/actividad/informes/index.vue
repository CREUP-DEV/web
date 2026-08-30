<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import type { AdminAreaReport } from '@/composables/admin/useAdminAreaReports'

definePageMeta({
  layout: 'admin',
  title: 'Informes de áreas',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()

const monthFilter = ref('')

// AdminNewsletterMonthPicker emits 'YYYY-MM-01'; the filter / API param use 'YYYY-MM'. Bridge both.
const monthPickerValue = computed({
  get: () => (monthFilter.value ? `${monthFilter.value}-01` : ''),
  set: (value: string) => {
    monthFilter.value = value ? value.slice(0, 7) : ''
  },
})

const {
  decrementTotal,
  items,
  total,
  pageCount,
  page,
  pageSize,
  pending,
  error: fetchError,
  refresh,
  removeItem,
} = useAdminAreaReports(monthFilter)

// Keep the pagination controls under the cursor when the page changes.
const paginationRef = ref<HTMLElement | null>(null)
usePaginationAnchor(page, paginationRef)

const showDeleteModal = ref(false)
const itemToDelete = ref<AdminAreaReport | null>(null)
const isDeleting = ref(false)

const getAreaName = (item: AdminAreaReport) => {
  const snapshot = item.areaNameSnapshot
  if (!snapshot) return t('admin.areaReports.list.unknownArea')
  return snapshot[locale.value] ?? snapshot.es ?? Object.values(snapshot)[0] ?? ''
}

const confirmDelete = (item: AdminAreaReport) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/area-reports/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    decrementTotal()
    await refreshAllClientAsyncData()
    showDeleteModal.value = false
    itemToDelete.value = null
    toast.add({ title: t('admin.areaReports.toast.deleted'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.areaReports.toast.deleteError')),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

const formatPeriod = (item: AdminAreaReport) => {
  const coversFrom = item.edition?.coversFrom
  if (coversFrom && coversFrom !== item.monthKey) {
    return `${coversFrom} → ${item.monthKey}`
  }
  return item.monthKey
}
</script>

<template>
  <div>
    <AdminActivitySubnav active="reports" />

    <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.areaReports.list.heading') }}</h1>
        <p class="text-muted mt-1 text-sm">{{ t('admin.areaReports.list.subheading') }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :to="localePath(ADMIN_ROUTES.areaCatalog)"
          icon="i-tabler-list-details"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.areaReports.list.manageAreas') }}
        </UButton>
        <UButton :to="localePath(ADMIN_ROUTES.activityReportsCreate)" icon="i-tabler-plus">
          {{ t('admin.areaReports.list.newReport') }}
        </UButton>
      </div>
    </div>

    <div class="mb-6 flex flex-wrap items-start gap-3">
      <UFormField :label="t('admin.areaReports.list.monthFilterLabel')">
        <ClientOnly>
          <AdminNewsletterMonthPicker v-model="monthPickerValue" hint="" />
          <template #fallback>
            <UInput
              :model-value="monthFilter"
              placeholder="YYYY-MM"
              icon="i-tabler-calendar-month"
              class="max-w-[12rem]"
              @update:model-value="monthFilter = String($event)"
            />
          </template>
        </ClientOnly>
      </UFormField>
      <UButton v-if="monthFilter" variant="ghost" size="sm" @click="monthFilter = ''">
        {{ t('admin.areaReports.list.clearFilter') }}
      </UButton>
    </div>

    <div v-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.areaReports.list.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <div v-if="pending" aria-hidden="true" class="space-y-3">
        <USkeleton v-for="n in 4" :key="n" class="h-24 w-full rounded-xl" />
      </div>

      <template v-else>
        <article
          v-for="item in items"
          :key="item.id"
          class="group rounded-xl border transition-shadow hover:shadow-md"
        >
          <NuxtLink
            :to="localePath(`${ADMIN_ROUTES.activityReports}/${item.id}`)"
            class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
          >
            <div class="shrink-0">
              <img
                v-if="item.listThumbnailUrl"
                :src="item.listThumbnailUrl"
                :alt="getAreaName(item)"
                class="h-20 w-32 rounded-lg object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="bg-muted flex h-20 w-32 items-center justify-center rounded-lg"
                aria-hidden="true"
              >
                <UIcon name="i-tabler-report" class="text-muted size-6 opacity-50" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="group-hover:text-primary mb-1 truncate text-base font-semibold">
                {{ getAreaName(item) }}
              </h3>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span class="text-muted flex items-center gap-1 text-xs">
                  <UIcon name="i-tabler-calendar" class="size-3.5" />
                  {{ formatPeriod(item) }}
                </span>
                <UBadge :color="item.active ? 'success' : 'neutral'" variant="subtle" size="sm">
                  {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
                </UBadge>
              </div>
            </div>

            <div
              class="flex shrink-0 items-center gap-1 self-start sm:self-center"
              @click.prevent.stop
            >
              <UButton
                :to="localePath(`${ADMIN_ROUTES.activityReports}/${item.id}`)"
                icon="i-tabler-pencil"
                variant="ghost"
                size="sm"
                :title="t('admin.areaReports.list.editTitle')"
                :aria-label="t('admin.areaReports.list.editAria')"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                :title="t('admin.areaReports.list.deleteTitle')"
                :aria-label="t('admin.areaReports.list.deleteAria')"
                @click="confirmDelete(item)"
              />
            </div>
          </NuxtLink>
        </article>

        <div v-if="!items.length && monthFilter.trim()" class="py-16 text-center">
          <UIcon name="i-tabler-search-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
          <p class="text-muted text-sm">
            {{ t('admin.areaReports.list.noFilterResults', { month: monthFilter }) }}
          </p>
          <UButton variant="link" size="sm" class="mt-2" @click="monthFilter = ''">
            {{ t('admin.areaReports.list.clearFilter') }}
          </UButton>
        </div>

        <div v-else-if="!items.length" class="py-16 text-center">
          <UIcon name="i-tabler-report-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
          <p class="text-muted mb-4 text-sm">{{ t('admin.areaReports.list.emptyState') }}</p>
          <UButton
            :to="localePath(ADMIN_ROUTES.activityReportsCreate)"
            icon="i-tabler-plus"
            size="sm"
          >
            {{ t('admin.areaReports.list.createFirst') }}
          </UButton>
        </div>

        <nav
          v-if="pageCount > 1"
          ref="paginationRef"
          class="flex justify-center pt-4"
          :aria-label="t('admin.areaReports.list.paginationAria')"
        >
          <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
        </nav>
      </template>
    </div>

    <UModal v-model:open="showDeleteModal" :title="t('admin.common.confirmDeleteTitle')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.common.confirmDeleteTitle') }}</h2>
          </div>
          <p class="text-muted mb-6">
            {{
              t('admin.common.deleteConfirm', {
                name: itemToDelete ? getAreaName(itemToDelete) : '',
              })
            }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">{{
              t('admin.common.delete')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
