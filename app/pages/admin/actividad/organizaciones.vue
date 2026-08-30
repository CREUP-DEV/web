<script setup lang="ts">
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'
import { createMemberOrgCatalogEntrySchema } from '~~/shared/utils/adminSchemas'
import type { MemberOrgSource } from '~~/shared/constants/activity'

definePageMeta({
  layout: 'admin',
  title: 'Organizaciones miembro',
})

const { t } = useI18n()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { formatDateTime } = useLocaleFormatting()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, formErrors, getFieldError, validate } = useFormValidation()

interface MemberOrgCatalogEntry {
  id: string
  source: MemberOrgSource
  selectionKey: string
  sourceKey: string | null
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
  order: number
  active: boolean
  supersededByEntryId: string | null
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
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
} = await useFetch<{ data: MemberOrgCatalogEntry[]; meta: CatalogSyncMeta }>(
  '/api/admin/member-org-catalog',
  {
    headers: localeApiHeaders,
    query: { includeInactive: 'true' },
    lazy: true,
  }
)

const { items, removeItem, replaceItem, setItems } = useAdminMutableCollection(data)

const MEMBER_ORG_SOURCE_TABS = ['asociado', 'sectorial'] as const

const sourceGroupLabel = (source: MemberOrgSource) =>
  source === 'asociado'
    ? t('admin.memberOrgCatalog.sourceGroupAsociados')
    : t('admin.memberOrgCatalog.sourceGroupSectoriales')

// Ordering is scoped per source on the server, so showing one group at a time also keeps the
// reorder controls unambiguous about which list they act on.
const activeSource = ref<MemberOrgSource>('asociado')

// Rendering the selected source as a one-item list keeps the section body (which reads `source`
// throughout) unchanged, while only ever mounting the group on screen. The reorder state lives at
// setup level, so nothing is lost when the other group unmounts.
const visibleSources = computed(() => [activeSource.value])

const activeItemsBySource = (source: MemberOrgSource) =>
  computed(() =>
    items.value
      .filter((item) => item.source === source && item.active && !item.supersededByEntryId)
      .sort((a, b) => a.order - b.order)
  )

const historicalItemsBySource = (source: MemberOrgSource) =>
  computed(() =>
    items.value
      .filter((item) => item.source === source && (!item.active || item.supersededByEntryId))
      .sort((a, b) => (b.lastSyncedAt ?? '').localeCompare(a.lastSyncedAt ?? ''))
  )

const activeAsociados = activeItemsBySource('asociado')
const activeSectoriales = activeItemsBySource('sectorial')
const historicalAsociados = historicalItemsBySource('asociado')
const historicalSectoriales = historicalItemsBySource('sectorial')

const persistSourceOrder =
  (source: MemberOrgSource) => async (updates: Array<{ id: string; order: number }>) => {
    await $fetch(`/api/admin/member-org-catalog/reorder?source=${source}`, {
      method: 'POST',
      body: { items: updates },
    })
    setItems(
      items.value.map((item) => {
        const nextOrder = updates.find((update) => update.id === item.id)?.order
        return nextOrder === undefined ? item : { ...item, order: nextOrder }
      })
    )
  }

const asociadoListRef = ref<HTMLElement | null>(null)
const sectorialListRef = ref<HTMLElement | null>(null)

const setListRef = (source: MemberOrgSource, el: Element | null) => {
  const target = el as HTMLElement | null
  if (source === 'asociado') {
    asociadoListRef.value = target
  } else {
    sectorialListRef.value = target
  }
}

const asociadoReorder = useReorderableAdminList({
  items: activeAsociados,
  listRef: asociadoListRef,
  persist: persistSourceOrder('asociado'),
})
const sectorialReorder = useReorderableAdminList({
  items: activeSectoriales,
  listRef: sectorialListRef,
  persist: persistSourceOrder('sectorial'),
})

const reorderBySource = (source: MemberOrgSource) =>
  source === 'asociado' ? asociadoReorder : sectorialReorder

const saveOrder = async (source: MemberOrgSource) => {
  try {
    await reorderBySource(source).persistOrder()
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.memberOrgCatalog.orderSavedToast'), color: 'success' })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.memberOrgCatalog.orderErrorToast')),
      color: 'error',
    })
  }
}

const syncFailedRecently = computed(() => {
  const meta = data.value?.meta
  if (!meta?.lastFailureAt) return false
  if (!meta.lastSuccessAt) return true
  return new Date(meta.lastFailureAt).getTime() > new Date(meta.lastSuccessAt).getTime()
})

const formatSyncDate = (iso: string | null) =>
  iso
    ? formatDateTime(iso, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : t('admin.memberOrgCatalog.neverSynced')

const isSubmitting = ref(false)
const isDeleting = ref(false)
const refreshingId = ref<string | null>(null)
const reactivatingId = ref<string | null>(null)
const supersedeSavingId = ref<string | null>(null)

const showModal = ref(false)
const editingItem = ref<MemberOrgCatalogEntry | null>(null)
const showDeleteModal = ref(false)
const itemToDelete = ref<MemberOrgCatalogEntry | null>(null)
const showSupersedeModal = ref(false)
const supersedeItem = ref<MemberOrgCatalogEntry | null>(null)
const supersedeTargetId = ref<string | null>(null)

const form = reactive({
  source: 'asociado' as MemberOrgSource,
  denomination: '',
  initials: '',
  logoLight: '',
  logoDark: '',
  order: 0,
  active: true,
})

const buildPayload = () => ({
  source: form.source,
  denomination: form.denomination,
  initials: form.initials,
  logoLight: form.logoLight.trim() ? form.logoLight.trim() : null,
  logoDark: form.logoDark.trim() ? form.logoDark.trim() : null,
  order: form.order,
  active: form.active,
})

const buildPayloadSnapshot = () => JSON.stringify(buildPayload())
const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

// Logos are uploaded rather than pasted as a URL, so an admin cannot point the catalog at an
// external host that later disappears or blocks hotlinking. Synced rows keep whatever the upstream
// feed gives them until someone uploads over it (and "refresh from source" puts the feed's back).
const {
  inputRef: logoLightInputRef,
  preview: logoLightPreview,
  isUploading: isUploadingLogoLight,
  triggerFileDialog: triggerLogoLightDialog,
  handleFileSelect: handleLogoLightSelect,
  setPreview: setLogoLightPreview,
} = useAdminFileUpload({
  endpoint: '/api/admin/member-org-catalog/upload',
  successMessage: t('admin.memberOrgCatalog.logoUploaded'),
  errorMessage: t('admin.memberOrgCatalog.logoUploadError'),
  onUploaded: (storagePath) => {
    form.logoLight = storagePath
  },
  getFallbackPreview: () => form.logoLight || null,
})

const {
  inputRef: logoDarkInputRef,
  preview: logoDarkPreview,
  isUploading: isUploadingLogoDark,
  triggerFileDialog: triggerLogoDarkDialog,
  handleFileSelect: handleLogoDarkSelect,
  setPreview: setLogoDarkPreview,
} = useAdminFileUpload({
  endpoint: '/api/admin/member-org-catalog/upload',
  successMessage: t('admin.memberOrgCatalog.logoUploaded'),
  errorMessage: t('admin.memberOrgCatalog.logoUploadError'),
  onUploaded: (storagePath) => {
    form.logoDark = storagePath
  },
  getFallbackPreview: () => form.logoDark || null,
})

const clearLogoLight = () => {
  form.logoLight = ''
  setLogoLightPreview(null)
}

const clearLogoDark = () => {
  form.logoDark = ''
  setLogoDarkPreview(null)
}

const openCreate = (source: MemberOrgSource) => {
  clearErrors()
  editingItem.value = null
  form.source = source
  form.denomination = ''
  form.initials = ''
  form.logoLight = ''
  form.logoDark = ''
  setLogoLightPreview(null)
  setLogoDarkPreview(null)
  form.order = activeItemsBySource(source).value.length
  form.active = true
  resetFormSnapshot()
  showModal.value = true
}

const openEdit = (item: MemberOrgCatalogEntry) => {
  clearErrors()
  editingItem.value = item
  form.source = item.source
  form.denomination = item.denomination
  form.initials = item.initials
  form.logoLight = item.logoLight ?? ''
  form.logoDark = item.logoDark ?? ''
  setLogoLightPreview(item.logoLight)
  setLogoDarkPreview(item.logoDark)
  form.order = item.order
  form.active = item.active
  resetFormSnapshot()
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const confirmDelete = (item: MemberOrgCatalogEntry) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const handleSubmit = async () => {
  const payload = buildPayload()

  if (editingItem.value && !hasFormChanges.value) {
    closeModal()
    clearErrors()
    return
  }

  if (!validate(createMemberOrgCatalogEntrySchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: MemberOrgCatalogEntry }>(
        `/api/admin/member-org-catalog/${editingItem.value.id}`,
        { method: 'PUT', body: { ...payload, updatedAt: editingItem.value.updatedAt } }
      )
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: t('admin.memberOrgCatalog.updatedToast'), color: 'success' })
    } else {
      const response = await $fetch<{ data: MemberOrgCatalogEntry }>(
        '/api/admin/member-org-catalog',
        { method: 'POST', body: payload }
      )
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: t('admin.memberOrgCatalog.createdToast'), color: 'success' })
    }
    closeModal()
    clearErrors()
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.memberOrgCatalog.saveErrorToast')),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/member-org-catalog/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    await refreshAllClientAsyncData()
    closeDeleteModal()
    toast.add({ title: t('admin.memberOrgCatalog.deletedToast'), color: 'success' })
  } catch (e) {
    const message =
      getApiErrorStatusCode(e) === 409
        ? t('admin.memberOrgCatalog.deleteBlockedToast')
        : getApiErrorMessage(e, t('admin.memberOrgCatalog.deleteErrorToast'))
    toast.add({ title: message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

const handleRefresh = async (item: MemberOrgCatalogEntry) => {
  refreshingId.value = item.id
  try {
    const response = await $fetch<{ data: MemberOrgCatalogEntry }>(
      `/api/admin/member-org-catalog/${item.id}/refresh`,
      { method: 'POST' }
    )
    replaceItem(response.data)
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.memberOrgCatalog.refreshedToast'), color: 'success' })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.memberOrgCatalog.refreshErrorToast')),
      color: 'error',
    })
  } finally {
    refreshingId.value = null
  }
}

const putFullPayload = (item: MemberOrgCatalogEntry, overrides: Record<string, unknown>) => ({
  source: item.source,
  denomination: item.denomination,
  initials: item.initials,
  logoLight: item.logoLight,
  logoDark: item.logoDark,
  order: item.order,
  active: item.active,
  updatedAt: item.updatedAt,
  ...overrides,
})

const handleReactivate = async (item: MemberOrgCatalogEntry) => {
  reactivatingId.value = item.id
  try {
    const response = await $fetch<{ data: MemberOrgCatalogEntry }>(
      `/api/admin/member-org-catalog/${item.id}`,
      { method: 'PUT', body: putFullPayload(item, { active: true }) }
    )
    replaceItem(response.data)
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.memberOrgCatalog.reactivatedToast'), color: 'success' })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.memberOrgCatalog.reactivateErrorToast')),
      color: 'error',
    })
  } finally {
    reactivatingId.value = null
  }
}

const openSupersede = (item: MemberOrgCatalogEntry) => {
  supersedeItem.value = item
  supersedeTargetId.value = item.supersededByEntryId
  showSupersedeModal.value = true
}

const supersedeOptions = computed(() => {
  if (!supersedeItem.value) return []
  const current = supersedeItem.value
  return items.value
    .filter((item) => item.source === current.source && item.active && item.id !== current.id)
    .map((item) => ({ label: `${item.denomination} (${item.initials})`, value: item.id }))
})

const isSupersedeSaving = ref(false)

const handleSupersedeSave = async () => {
  if (!supersedeItem.value) return
  isSupersedeSaving.value = true
  try {
    const response = await $fetch<{ data: MemberOrgCatalogEntry }>(
      `/api/admin/member-org-catalog/${supersedeItem.value.id}`,
      {
        method: 'PUT',
        body: putFullPayload(supersedeItem.value, {
          supersededByEntryId: supersedeTargetId.value,
        }),
      }
    )
    replaceItem(response.data)
    await refreshAllClientAsyncData()
    showSupersedeModal.value = false
    toast.add({ title: t('admin.memberOrgCatalog.supersedeSaved'), color: 'success' })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.memberOrgCatalog.supersedeError')),
      color: 'error',
    })
  } finally {
    isSupersedeSaving.value = false
  }
}

const handleClearSupersede = async (item: MemberOrgCatalogEntry) => {
  supersedeSavingId.value = item.id
  try {
    const response = await $fetch<{ data: MemberOrgCatalogEntry }>(
      `/api/admin/member-org-catalog/${item.id}`,
      { method: 'PUT', body: putFullPayload(item, { supersededByEntryId: null }) }
    )
    replaceItem(response.data)
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.memberOrgCatalog.supersedeSaved'), color: 'success' })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.memberOrgCatalog.supersedeError')),
      color: 'error',
    })
  } finally {
    supersedeSavingId.value = null
  }
}
</script>

<template>
  <div>
    <UButton
      :to="localePath(ADMIN_ROUTES.activity)"
      variant="ghost"
      icon="i-tabler-arrow-left"
      size="sm"
      class="mb-3"
    >
      {{ t('admin.common.back') }}
    </UButton>

    <div class="mb-6">
      <h1 class="text-2xl font-bold">{{ t('admin.memberOrgCatalog.title') }}</h1>
      <p class="text-muted mt-1 text-sm">{{ t('admin.memberOrgCatalog.subheading') }}</p>
    </div>

    <UAlert
      v-if="syncFailedRecently"
      class="mb-6"
      color="warning"
      variant="soft"
      icon="i-tabler-cloud-off"
      :title="t('admin.memberOrgCatalog.syncFailedBanner')"
      :description="
        data?.meta.lastFailureAt
          ? t('admin.memberOrgCatalog.syncFailedSince', {
              date: formatSyncDate(data.meta.lastFailureAt),
            })
          : undefined
      "
    />

    <div v-if="pending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-20 w-full rounded-xl" />
      <USkeleton class="h-20 w-full rounded-xl" />
      <USkeleton class="h-20 w-full rounded-xl" />
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.memberOrgCatalog.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <template v-else>
      <div
        class="mb-6 flex gap-2 border-b"
        role="tablist"
        :aria-label="t('admin.memberOrgCatalog.sourceTabsAria')"
      >
        <UButton
          v-for="source in MEMBER_ORG_SOURCE_TABS"
          :key="source"
          :variant="activeSource === source ? 'solid' : 'ghost'"
          :icon="source === 'asociado' ? 'i-tabler-building-community' : 'i-tabler-users-group'"
          size="sm"
          role="tab"
          :aria-selected="activeSource === source"
          class="rounded-b-none"
          @click="activeSource = source"
        >
          {{ sourceGroupLabel(source) }}
        </UButton>
      </div>

      <section v-for="source in visibleSources" :key="source" class="mb-10">
        <div class="mb-3 flex items-center justify-end">
          <div class="flex gap-2">
            <template v-if="reorderBySource(source).hasOrderChanges.value">
              <UButton variant="outline" @click="reorderBySource(source).cancelOrderChanges()">{{
                t('admin.common.cancel')
              }}</UButton>
              <UButton
                :loading="reorderBySource(source).isSavingOrder.value"
                @click="saveOrder(source)"
              >
                {{ t('admin.common.saveOrder') }}
              </UButton>
            </template>
            <UButton v-else icon="i-tabler-plus" size="sm" @click="openCreate(source)">
              {{ t('admin.memberOrgCatalog.addManual') }}
            </UButton>
          </div>
        </div>

        <div :ref="(el) => setListRef(source, el as Element | null)" class="space-y-2">
          <div
            v-for="item in reorderBySource(source).localItems.value"
            :key="item.id"
            class="bg-surface ring-default flex items-center gap-4 rounded-xl p-4 shadow-sm ring-1"
          >
            <div class="drag-handle cursor-grab active:cursor-grabbing">
              <UIcon name="i-tabler-grip-vertical" class="text-muted size-5" />
            </div>
            <img
              v-if="item.logoLight"
              :src="item.logoLight"
              :alt="item.denomination"
              class="size-10 shrink-0 rounded object-contain"
            />
            <div class="min-w-0 flex-1">
              <h3 class="wrap-break-words font-medium">
                {{ item.denomination }} <span class="text-muted">({{ item.initials }})</span>
              </h3>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <UBadge v-if="item.sourceKey === null" variant="subtle" size="sm">
                  {{ t('admin.memberOrgCatalog.manualBadge') }}
                </UBadge>
                <UBadge v-else variant="outline" size="sm">
                  {{ t('admin.memberOrgCatalog.syncedBadge') }}
                </UBadge>
                <span class="text-muted text-xs">
                  {{ t('admin.memberOrgCatalog.lastSyncedLabel') }}:
                  {{ formatSyncDate(item.lastSyncedAt) }}
                </span>
              </div>
            </div>
            <div class="flex shrink-0 gap-1">
              <UButton
                v-if="item.sourceKey !== null"
                icon="i-tabler-refresh"
                variant="ghost"
                size="sm"
                :loading="refreshingId === item.id"
                :title="t('admin.memberOrgCatalog.refreshAction')"
                :aria-label="t('admin.memberOrgCatalog.refreshAction')"
                @click="handleRefresh(item)"
              />
              <UButton
                icon="i-tabler-arrow-forward-up"
                variant="ghost"
                size="sm"
                :title="t('admin.memberOrgCatalog.supersedeAction')"
                :aria-label="t('admin.memberOrgCatalog.supersedeAction')"
                @click="openSupersede(item)"
              />
              <UButton
                icon="i-tabler-pencil"
                variant="ghost"
                size="sm"
                :aria-label="t('admin.memberOrgCatalog.editAria')"
                @click="openEdit(item)"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                :aria-label="t('admin.memberOrgCatalog.deleteAria')"
                @click="confirmDelete(item)"
              />
            </div>
          </div>

          <div v-if="!reorderBySource(source).localItems.value.length" class="py-8 text-center">
            <p class="text-muted text-sm">{{ t('admin.memberOrgCatalog.emptyActive') }}</p>
          </div>
        </div>

        <details
          v-if="(source === 'asociado' ? historicalAsociados : historicalSectoriales).length"
          class="mt-4"
        >
          <summary
            class="text-muted mb-2 cursor-pointer text-sm font-semibold tracking-wide uppercase"
          >
            {{ t('admin.memberOrgCatalog.groupHistorical') }} ({{
              (source === 'asociado' ? historicalAsociados : historicalSectoriales).length
            }})
          </summary>
          <div class="space-y-2">
            <div
              v-for="item in source === 'asociado' ? historicalAsociados : historicalSectoriales"
              :key="item.id"
              class="bg-surface ring-default flex items-center gap-4 rounded-xl p-4 opacity-75 shadow-sm ring-1"
            >
              <div class="min-w-0 flex-1">
                <h3 class="wrap-break-words font-medium">
                  {{ item.denomination }} <span class="text-muted">({{ item.initials }})</span>
                </h3>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <UBadge
                    v-if="item.supersededByEntryId"
                    color="warning"
                    variant="subtle"
                    size="sm"
                  >
                    {{ t('admin.memberOrgCatalog.supersededBadge') }}
                  </UBadge>
                  <UBadge v-if="item.sourceKey === null" variant="subtle" size="sm">
                    {{ t('admin.memberOrgCatalog.manualBadge') }}
                  </UBadge>
                  <UBadge v-else variant="outline" size="sm">
                    {{ t('admin.memberOrgCatalog.syncedBadge') }}
                  </UBadge>
                  <span class="text-muted text-xs">
                    {{ t('admin.memberOrgCatalog.lastSyncedLabel') }}:
                    {{ formatSyncDate(item.lastSyncedAt) }}
                  </span>
                </div>
              </div>
              <div class="flex shrink-0 gap-1">
                <UButton
                  v-if="item.supersededByEntryId"
                  variant="outline"
                  size="sm"
                  :loading="supersedeSavingId === item.id"
                  @click="handleClearSupersede(item)"
                >
                  {{ t('admin.memberOrgCatalog.clearSupersedeAction') }}
                </UButton>
                <UButton
                  v-else
                  variant="outline"
                  size="sm"
                  :loading="reactivatingId === item.id"
                  @click="handleReactivate(item)"
                >
                  {{ t('admin.memberOrgCatalog.reactivateAction') }}
                </UButton>
                <UButton
                  icon="i-tabler-pencil"
                  variant="ghost"
                  size="sm"
                  :aria-label="t('admin.memberOrgCatalog.editAria')"
                  @click="openEdit(item)"
                />
                <UButton
                  icon="i-tabler-trash"
                  variant="ghost"
                  color="error"
                  size="sm"
                  :aria-label="t('admin.memberOrgCatalog.deleteAria')"
                  @click="confirmDelete(item)"
                />
              </div>
            </div>
          </div>
        </details>
      </section>
    </template>

    <UModal
      v-model:open="showModal"
      :title="
        editingItem ? t('admin.memberOrgCatalog.editTitle') : t('admin.memberOrgCatalog.newTitle')
      "
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{
                editingItem
                  ? t('admin.memberOrgCatalog.editTitle')
                  : t('admin.memberOrgCatalog.newTitle')
              }}
            </h2>

            <form id="member-org-catalog-form" class="space-y-4" @submit.prevent="handleSubmit">
              <AdminFormErrorSummary :errors="formErrors" />

              <UFormField :label="t('admin.memberOrgCatalog.sourceLabel')">
                <UInput :model-value="sourceGroupLabel(form.source)" disabled class="w-full" />
              </UFormField>

              <UFormField
                :label="t('admin.memberOrgCatalog.denominationLabel')"
                :error="getFieldError('denomination')"
              >
                <UInput v-model="form.denomination" class="w-full" />
              </UFormField>

              <UFormField
                :label="t('admin.memberOrgCatalog.initialsLabel')"
                :error="getFieldError('initials')"
              >
                <UInput v-model="form.initials" class="w-full" />
              </UFormField>

              <UFormField
                :label="t('admin.memberOrgCatalog.logoLightLabel')"
                :error="getFieldError('logoLight')"
              >
                <div class="space-y-3">
                  <div
                    v-if="logoLightPreview"
                    class="bg-muted/30 flex items-center justify-center rounded-lg border p-4"
                  >
                    <img
                      :src="logoLightPreview"
                      :alt="t('admin.memberOrgCatalog.logoPreviewAlt')"
                      class="max-h-24 max-w-full object-contain"
                    />
                  </div>

                  <input
                    ref="logoLightInputRef"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                    class="hidden"
                    @change="handleLogoLightSelect"
                  />

                  <div class="flex flex-wrap gap-2">
                    <UButton
                      type="button"
                      variant="outline"
                      icon="i-tabler-upload"
                      :loading="isUploadingLogoLight"
                      @click="triggerLogoLightDialog"
                    >
                      {{
                        logoLightPreview
                          ? t('admin.memberOrgCatalog.changeLogo')
                          : t('admin.memberOrgCatalog.uploadLogo')
                      }}
                    </UButton>
                    <UButton
                      v-if="logoLightPreview"
                      type="button"
                      variant="ghost"
                      color="error"
                      icon="i-tabler-trash"
                      @click="clearLogoLight"
                    >
                      {{ t('admin.memberOrgCatalog.removeLogo') }}
                    </UButton>
                  </div>
                </div>
              </UFormField>

              <UFormField
                :label="t('admin.memberOrgCatalog.logoDarkLabel')"
                :error="getFieldError('logoDark')"
              >
                <div class="space-y-3">
                  <div
                    v-if="logoDarkPreview"
                    class="bg-muted/30 flex items-center justify-center rounded-lg border p-4"
                  >
                    <img
                      :src="logoDarkPreview"
                      :alt="t('admin.memberOrgCatalog.logoPreviewAlt')"
                      class="max-h-24 max-w-full object-contain"
                    />
                  </div>

                  <input
                    ref="logoDarkInputRef"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                    class="hidden"
                    @change="handleLogoDarkSelect"
                  />

                  <div class="flex flex-wrap gap-2">
                    <UButton
                      type="button"
                      variant="outline"
                      icon="i-tabler-upload"
                      :loading="isUploadingLogoDark"
                      @click="triggerLogoDarkDialog"
                    >
                      {{
                        logoDarkPreview
                          ? t('admin.memberOrgCatalog.changeLogo')
                          : t('admin.memberOrgCatalog.uploadLogo')
                      }}
                    </UButton>
                    <UButton
                      v-if="logoDarkPreview"
                      type="button"
                      variant="ghost"
                      color="error"
                      icon="i-tabler-trash"
                      @click="clearLogoDark"
                    >
                      {{ t('admin.memberOrgCatalog.removeLogo') }}
                    </UButton>
                  </div>
                </div>
              </UFormField>

              <UFormField>
                <UCheckbox v-model="form.active" :label="t('admin.memberOrgCatalog.activeLabel')" />
              </UFormField>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton
              type="submit"
              form="member-org-catalog-form"
              :loading="isSubmitting"
              :disabled="Boolean(editingItem) && !hasFormChanges"
            >
              {{ editingItem ? t('admin.common.save') : t('admin.common.create') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="showSupersedeModal"
      :title="t('admin.memberOrgCatalog.supersedeModalTitle')"
    >
      <template #content>
        <div class="p-6">
          <h2 class="mb-2 text-lg font-bold">
            {{ t('admin.memberOrgCatalog.supersedeModalTitle') }}
          </h2>
          <p class="text-muted mb-4 text-sm">
            {{ t('admin.memberOrgCatalog.supersedeModalHint') }}
          </p>
          <UFormField :label="t('admin.memberOrgCatalog.supersedeTargetLabel')">
            <USelectMenu
              :model-value="supersedeTargetId ?? undefined"
              :items="supersedeOptions"
              value-key="value"
              :placeholder="t('admin.memberOrgCatalog.supersedeNone')"
              class="w-full"
              @update:model-value="supersedeTargetId = $event ?? null"
            />
          </UFormField>
          <div class="mt-6 flex justify-end gap-2">
            <UButton variant="ghost" @click="showSupersedeModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton :loading="isSupersedeSaving" @click="handleSupersedeSave">
              {{ t('admin.common.save') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

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
                name: itemToDelete?.denomination ?? '',
              })
            }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">
              {{ t('admin.common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
