<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { ACTIVITY_KINDS, ACTIVITY_PUBLIC_BASE_PATH } from '~~/shared/constants/activity'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'
import { isActivityEntryPublic } from '~~/shared/utils/publicVisibility'
import type { AdminActivityEntry, AdminActivityKind } from '@/composables/admin/useAdminActivity'

definePageMeta({
  layout: 'admin',
  title: 'Nuestra actividad',
})

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useAdminToast()
const { formatDate: formatLocaleDate } = useLocaleFormatting()
const { getDefaultTranslationValue } = useLocales()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()

const currentKind = ref<AdminActivityKind | null>(null)
const searchQuery = ref('')

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
  refreshAfterRemoval,
  removeItem,
} = useAdminActivity(currentKind, searchQuery)

// Skeletons only on a first load; a refetch (page, filter, backfill after a delete) dims the rows.
const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, items, fetchError)

// Keep the pagination controls under the cursor when the page changes.
const paginationRef = ref<HTMLElement | null>(null)
usePaginationAnchor(page, paginationRef)

const kindLabels: Record<AdminActivityKind, string> = {
  creup: t('admin.activity.kinds.creup'),
  member: t('admin.activity.kinds.member'),
}
const kindIcons: Record<AdminActivityKind, string> = {
  creup: 'i-tabler-building-bank',
  member: 'i-tabler-building-community',
}

const showDeleteModal = ref(false)
const itemToDelete = ref<AdminActivityEntry | null>(null)
const isDeleting = ref(false)

const getItemTitle = (item: AdminActivityEntry) =>
  getDefaultTranslationValue(item.translations, 'title') ?? item.translations[0]?.title ?? ''
const getItemExcerpt = (item: AdminActivityEntry) =>
  getDefaultTranslationValue(item.translations, 'excerpt') ?? item.translations[0]?.excerpt ?? ''

const formatDate = (iso: string) =>
  formatLocaleDate(iso, { year: 'numeric', month: 'short', day: 'numeric' })

const formatRange = (item: AdminActivityEntry) =>
  item.endDate && item.endDate !== item.startDate
    ? `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`
    : formatDate(item.startDate)

const getEditPath = (item: AdminActivityEntry) => localePath(`${ADMIN_ROUTES.activity}/${item.id}`)

const getPublicPath = (item: AdminActivityEntry) =>
  localePath(`${ACTIVITY_PUBLIC_BASE_PATH}/${item.slug}`)

const getPreviewPath = (item: AdminActivityEntry) =>
  localePath(`${ADMIN_ROUTES.activityPreview}/${item.id}`)

const confirmDelete = (item: AdminActivityEntry) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const handleDelete = async () => {
  const item = itemToDelete.value
  if (!item) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/activity/${item.id}`, {
      method: 'DELETE',
      query: { updatedAt: item.updatedAt },
    })
    removeItem(item.id)
    decrementTotal()
    await refreshAllClientAsyncData()
    closeDeleteModal()
    toast.add({ title: t('admin.activity.toast.deleted'), color: 'success' })
    await refreshAfterRemoval()
  } catch (error) {
    // 409: another admin changed the entry since this list loaded; show it as it is now.
    const isConflict = getApiErrorStatusCode(error) === 409
    toast.add({
      title: getApiErrorMessage(error, t('admin.activity.toast.deleteError')),
      color: isConflict ? 'warning' : 'error',
    })
    if (isConflict) {
      closeDeleteModal()
      await refresh()
    }
  } finally {
    isDeleting.value = false
  }
}

const tabItems = computed(() => [
  { key: 'all' as const, label: t('admin.activity.list.allTab'), icon: 'i-tabler-list' },
  ...ACTIVITY_KINDS.map((kind) => ({ key: kind, label: kindLabels[kind], icon: kindIcons[kind] })),
])

const activeTab = computed({
  get: () => currentKind.value ?? 'all',
  set: (val: string) => {
    currentKind.value = val === 'all' ? null : (val as AdminActivityKind)
  },
})
</script>

<template>
  <div>
    <AdminActivitySubnav active="entries" />

    <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.activity.list.heading') }}</h1>
        <p class="text-muted mt-1 text-sm">{{ t('admin.activity.list.subheading') }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :to="localePath(ADMIN_ROUTES.memberOrgCatalog)"
          icon="i-tabler-building-community"
          variant="outline"
        >
          {{ t('admin.activity.list.manageOrganisers') }}
        </UButton>
        <UButton
          :to="`${localePath(ADMIN_ROUTES.activityCreate)}?kind=creup`"
          icon="i-tabler-building-bank"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.activity.list.newCreup') }}
        </UButton>
        <UButton
          :to="`${localePath(ADMIN_ROUTES.activityCreate)}?kind=member`"
          icon="i-tabler-building-community"
          variant="outline"
          color="neutral"
        >
          {{ t('admin.activity.list.newMember') }}
        </UButton>
      </div>
    </div>

    <div class="mb-6 space-y-4">
      <div
        class="flex gap-2 overflow-x-auto"
        role="group"
        :aria-label="t('admin.activity.list.filterByKindAria')"
      >
        <UButton
          v-for="tab in tabItems"
          :key="tab.key"
          :icon="tab.icon"
          :variant="activeTab === tab.key ? 'solid' : 'outline'"
          :aria-pressed="activeTab === tab.key"
          size="sm"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </UButton>
      </div>

      <UInput
        v-model="searchQuery"
        icon="i-tabler-search"
        :placeholder="t('admin.activity.list.searchPlaceholder')"
        class="max-w-sm"
      />
    </div>

    <div v-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.activity.list.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else ref="resultsRef" class="space-y-3" :aria-busy="pending || undefined">
      <div v-if="isLoading" aria-hidden="true" class="space-y-3">
        <div v-for="n in 5" :key="n" class="rounded-xl border p-4">
          <div class="flex gap-4">
            <USkeleton class="h-24 w-40 shrink-0 rounded-lg" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-3/4" />
              <USkeleton class="h-4 w-1/2" />
              <USkeleton class="h-4 w-1/3" />
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div
          v-if="items.length"
          class="space-y-3"
          :class="isRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
        >
          <!-- Stretched link: the title's ::after overlay makes the whole card open the editor,
               while the actions sit above it as siblings instead of nesting inside the link. -->
          <article
            v-for="item in items"
            :key="item.id"
            class="group has-focus-visible:ring-primary relative flex flex-col gap-4 rounded-xl border p-4 transition-shadow hover:shadow-md has-focus-visible:ring-2 sm:flex-row sm:items-center"
          >
            <div class="shrink-0">
              <img
                v-if="item.listThumbnailUrl"
                :src="item.listThumbnailUrl"
                alt=""
                class="h-24 w-full rounded-lg object-cover sm:w-40"
                loading="lazy"
              />
              <div
                v-else
                class="bg-muted flex h-24 w-full items-center justify-center rounded-lg sm:w-40"
                aria-hidden="true"
              />
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="group-hover:text-primary mb-1 truncate text-base font-semibold">
                <NuxtLink
                  :to="getEditPath(item)"
                  class="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {{ getItemTitle(item) }}
                </NuxtLink>
              </h3>
              <p v-if="getItemExcerpt(item)" class="text-muted mb-2 line-clamp-1 text-sm">
                {{ getItemExcerpt(item) }}
              </p>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span class="text-muted flex items-center gap-1 text-xs">
                  <UIcon name="i-tabler-calendar" class="size-3.5" />
                  {{ formatRange(item) }}
                </span>

                <UBadge variant="subtle" size="sm">
                  <UIcon :name="kindIcons[item.kind]" class="mr-1 size-3" />
                  {{ kindLabels[item.kind] }}
                </UBadge>

                <UBadge v-if="item.isOnline" variant="subtle" color="info" size="sm">
                  <UIcon name="i-tabler-world" class="mr-0.5 size-3" />
                  {{ t('admin.activity.list.online') }}
                </UBadge>
                <UBadge v-else-if="item.location" variant="outline" size="sm">
                  <UIcon name="i-tabler-map-pin" class="mr-0.5 size-3" />
                  {{ item.location }}
                </UBadge>

                <UBadge v-if="item.memberOrgSnapshot" variant="outline" size="sm">
                  {{ item.memberOrgSnapshot.initials }}
                </UBadge>

                <UBadge :color="item.active ? 'success' : 'neutral'" variant="subtle" size="sm">
                  {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
                </UBadge>
              </div>
            </div>

            <div class="relative z-10 flex shrink-0 items-center gap-1 self-start sm:self-center">
              <UButton
                v-if="isActivityEntryPublic(item)"
                :to="getPublicPath(item)"
                icon="i-tabler-external-link"
                variant="ghost"
                size="sm"
                target="_blank"
                :title="t('admin.activity.form.viewOnWebAria')"
                :aria-label="t('admin.activity.form.viewOnWebAria')"
              />
              <UButton
                v-else
                :to="getPreviewPath(item)"
                icon="i-tabler-eye"
                variant="ghost"
                size="sm"
                target="_blank"
                :title="t('admin.activity.form.previewInactive')"
                :aria-label="t('admin.activity.form.previewInactive')"
              />
              <UButton
                :to="getEditPath(item)"
                icon="i-tabler-pencil"
                variant="ghost"
                size="sm"
                :title="t('admin.activity.list.editTitle')"
                :aria-label="t('admin.activity.list.editAria')"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                :title="t('admin.activity.list.deleteTitle')"
                :aria-label="t('admin.activity.list.deleteAria')"
                @click="confirmDelete(item)"
              />
            </div>
          </article>
        </div>

        <div v-if="!items.length && searchQuery.trim()" class="py-16 text-center">
          <UIcon name="i-tabler-search-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
          <p class="text-muted text-sm">
            {{ t('admin.activity.list.noSearchResults', { query: searchQuery }) }}
          </p>
          <UButton variant="link" size="sm" class="mt-2" @click="searchQuery = ''">
            {{ t('admin.activity.list.clearSearch') }}
          </UButton>
        </div>

        <div v-else-if="!items.length" class="py-16 text-center">
          <UIcon name="i-tabler-calendar-off" class="text-muted mx-auto mb-3 size-10 opacity-40" />
          <p class="text-muted mb-4 text-sm">{{ t('admin.activity.list.emptyState') }}</p>
          <UButton
            :to="`${localePath(ADMIN_ROUTES.activityCreate)}?kind=creup`"
            icon="i-tabler-plus"
            size="sm"
          >
            {{ t('admin.activity.list.createFirst') }}
          </UButton>
        </div>

        <nav
          v-if="pageCount > 1"
          ref="paginationRef"
          class="flex justify-center pt-4"
          :aria-label="t('admin.activity.list.paginationAria')"
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
                name: itemToDelete ? getItemTitle(itemToDelete) : '',
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
