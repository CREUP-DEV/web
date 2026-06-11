<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

definePageMeta({
  layout: 'admin',
  title: 'Suscriptores de newsletter',
})

interface Subscriber {
  id: string
  email: string
  active: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const localePath = useLocalePath()
const LIMIT = 20
const page = ref(1)
const offset = computed(() => (page.value - 1) * LIMIT)

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: Subscriber[]
  meta: {
    activeTotal: number
    total: number
  }
}>('/api/admin/newsletter/subscribers', {
  headers: localeApiHeaders,
  lazy: true,
  query: computed(() => ({
    limit: LIMIT,
    offset: offset.value,
  })),
})
const sortSubscribers = (left: Subscriber, right: Subscriber) => {
  const rightSubscribedAt = new Date(right.subscribedAt).getTime() || 0
  const leftSubscribedAt = new Date(left.subscribedAt).getTime() || 0

  if (leftSubscribedAt !== rightSubscribedAt) {
    return rightSubscribedAt - leftSubscribedAt
  }

  return right.id.localeCompare(left.id, 'es')
}

const {
  items: allItems,
  removeItem,
  replaceItem,
  setItems,
  updateMeta,
} = useAdminMutableCollection(data, {
  sortItems: sortSubscribers,
})
const totalCount = computed(() => data.value?.meta.total ?? 0)
const activeCount = computed(() => data.value?.meta.activeTotal ?? 0)
const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(
  pending,
  allItems,
  fetchError
)

// Filter
const showActiveOnly = ref(false)
const items = computed(() =>
  showActiveOnly.value ? allItems.value.filter((s) => s.active) : allItems.value
)

// Search
const search = ref('')
const filteredItems = computed(() => {
  if (!search.value.trim()) return items.value
  const q = search.value.trim().toLowerCase()
  return items.value.filter((s) => s.email.toLowerCase().includes(q))
})

// Add subscriber modal
const showAddModal = ref(false)
const newEmail = ref('')
const isAdding = ref(false)

async function handleAdd() {
  if (!newEmail.value.trim() || isAdding.value) return
  isAdding.value = true
  try {
    const response = await $fetch<{ data: Subscriber }>('/api/admin/newsletter/subscribers', {
      method: 'POST',
      body: { email: newEmail.value.trim(), active: true },
    })
    if (page.value === 1) {
      setItems([response.data, ...allItems.value].slice(0, LIMIT))
    }
    updateMeta((meta) => ({
      activeTotal: (meta?.activeTotal ?? 0) + (response.data.active ? 1 : 0),
      total: (meta?.total ?? 0) + 1,
    }))
    toast.add({ title: t('admin.newsletter.subscribers.addedToast'), color: 'success' })
    showAddModal.value = false
    newEmail.value = ''
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletter.subscribers.addErrorToast')),
      color: 'error',
    })
  } finally {
    isAdding.value = false
  }
}

// Toggle active
async function toggleActive(item: Subscriber) {
  try {
    const response = await $fetch<{ data: Subscriber }>(
      `/api/admin/newsletter/subscriber/${item.id}`,
      {
        method: 'PUT',
        body: { email: item.email, active: !item.active },
      }
    )
    const activeDelta = response.data.active === item.active ? 0 : response.data.active ? 1 : -1
    replaceItem(response.data)
    updateMeta((meta) => ({
      activeTotal: Math.max(0, (meta?.activeTotal ?? 0) + activeDelta),
      total: meta?.total ?? 0,
    }))
    toast.add({
      title: item.active
        ? t('admin.newsletter.subscribers.deactivatedToast')
        : t('admin.newsletter.subscribers.reactivatedToast'),
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletter.subscribers.updateErrorToast')),
      color: 'error',
    })
  }
}

// Delete
const showDeleteModal = ref(false)
const itemToDelete = ref<Subscriber | null>(null)
const isDeleting = ref(false)

function confirmDelete(item: Subscriber) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return
  const deletingSubscriber = itemToDelete.value
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/newsletter/subscriber/${deletingSubscriber.id}`, {
      method: 'DELETE',
    })
    removeItem(deletingSubscriber.id)
    updateMeta((meta) => ({
      activeTotal: Math.max(0, (meta?.activeTotal ?? 0) - (deletingSubscriber.active ? 1 : 0)),
      total: Math.max(0, (meta?.total ?? 0) - 1),
    }))
    showDeleteModal.value = false
    itemToDelete.value = null
    toast.add({ title: t('admin.newsletter.subscribers.deletedToast'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletter.subscribers.deleteErrorToast')),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

watch(page, () => {
  nextTick(() => {
    if (resultsRef.value instanceof HTMLElement) {
      resultsRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <UButton
            :to="localePath(ADMIN_ROUTES.newsletter)"
            icon="i-tabler-arrow-left"
            variant="ghost"
            size="sm"
          />
          <h1 class="text-2xl font-bold">{{ t('admin.newsletter.subscribers.title') }}</h1>
        </div>
        <p class="text-muted mt-1 text-sm">
          {{
            t('admin.newsletter.subscribers.activeOfTotal', {
              active: activeCount,
              total: totalCount,
            })
          }}
        </p>
      </div>
      <UButton icon="i-tabler-plus" @click="showAddModal = true">{{
        t('admin.common.add')
      }}</UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        icon="i-tabler-search"
        :placeholder="t('admin.newsletter.subscribers.searchPlaceholder')"
        :aria-label="t('admin.newsletter.subscribers.searchAria')"
        class="w-full max-w-xs"
      />
      <UButton
        :variant="showActiveOnly ? 'solid' : 'outline'"
        size="sm"
        :aria-pressed="showActiveOnly"
        @click="showActiveOnly = !showActiveOnly"
      >
        {{ t('admin.newsletter.subscribers.activeOnly') }}
      </UButton>
    </div>

    <div ref="resultsRef" aria-live="polite" :aria-busy="pending || undefined">
      <div v-if="isLoading" class="space-y-3" aria-hidden="true">
        <USkeleton class="h-16 w-full rounded-xl" />
        <USkeleton class="h-16 w-full rounded-xl" />
        <USkeleton class="h-16 w-full rounded-xl" />
      </div>

      <div v-else-if="fetchError" class="space-y-3">
        <UAlert
          color="error"
          variant="soft"
          :title="t('admin.newsletter.subscribers.loadErrorTitle')"
          :description="t('admin.common.loadErrorDescription')"
        />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
          {{ t('admin.common.retry') }}
        </UButton>
      </div>

      <div v-else-if="filteredItems.length === 0" class="py-12 text-center">
        <p class="text-muted">
          {{
            search
              ? t('admin.newsletter.subscribers.emptySearch')
              : t('admin.newsletter.subscribers.empty')
          }}
        </p>
        <UButton
          v-if="!search"
          class="mt-4"
          size="sm"
          icon="i-tabler-plus"
          @click="showAddModal = true"
        >
          {{ t('admin.newsletter.subscribers.addSubscriber') }}
        </UButton>
      </div>

      <div
        v-else
        class="space-y-2"
        :class="isRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
      >
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="bg-surface ring-default flex items-center gap-4 rounded-lg px-4 py-3 ring-1"
        >
          <div class="flex-1 overflow-hidden">
            <p class="truncate font-medium">{{ item.email }}</p>
            <p class="text-muted text-xs">
              {{
                t('admin.newsletter.subscribers.subscribedOn', {
                  date: formatDate(item.subscribedAt),
                })
              }}
              <template v-if="item.unsubscribedAt">
                ·
                {{
                  t('admin.newsletter.subscribers.unsubscribedOn', {
                    date: formatDate(item.unsubscribedAt),
                  })
                }}
              </template>
            </p>
          </div>
          <span
            :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
            class="shrink-0 rounded-full px-2 py-0.5 text-xs"
          >
            {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
          </span>
          <div class="flex gap-1">
            <UTooltip
              :text="
                item.active
                  ? t('admin.newsletter.subscribers.deactivate')
                  : t('admin.newsletter.subscribers.reactivate')
              "
            >
              <UButton
                :icon="item.active ? 'i-tabler-user-minus' : 'i-tabler-user-plus'"
                variant="ghost"
                size="sm"
                @click="toggleActive(item)"
              />
            </UTooltip>
            <UTooltip :text="t('admin.common.delete')">
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete(item)"
              />
            </UTooltip>
          </div>
        </div>
      </div>

      <nav
        v-if="totalCount > LIMIT"
        class="flex justify-center pt-4"
        :aria-label="t('admin.newsletter.subscribers.paginationAria')"
      >
        <UPagination v-model:page="page" :total="totalCount" :items-per-page="LIMIT" />
      </nav>
    </div>

    <UModal v-model:open="showAddModal" :title="t('admin.newsletter.subscribers.addSubscriber')">
      <template #body>
        <form class="space-y-4" @submit.prevent="handleAdd">
          <p class="text-dimmed text-sm">
            {{ t('admin.newsletter.subscribers.addConsentNote') }}
          </p>
          <UFormField :label="`${t('admin.newsletter.subscribers.emailLabel')} *`">
            <UInput
              v-model="newEmail"
              type="email"
              :placeholder="t('admin.newsletter.subscribers.emailPlaceholder')"
              required
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="showAddModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton type="submit" :loading="isAdding" :disabled="!newEmail.trim()">
              {{ t('admin.common.add') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="showDeleteModal"
      :title="t('admin.newsletter.subscribers.deleteModalTitle')"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">
              {{ t('admin.newsletter.subscribers.deleteModalTitle') }}
            </h2>
          </div>
          <p class="text-muted mb-6">
            {{ t('admin.newsletter.subscribers.deleteConfirmPrefix') }}
            <strong>{{ itemToDelete?.email }}</strong
            >{{ t('admin.newsletter.subscribers.deleteConfirmSuffix') }}
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
