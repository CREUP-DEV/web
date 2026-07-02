<script setup lang="ts">
import type { AdminActivityEntry } from '@/composables/admin/useAdminActivity'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'

definePageMeta({
  layout: 'admin',
  title: 'Editar entrada de actividad',
})

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const isSubmitting = ref(false)
const isRefreshingSnapshot = ref(false)
const activityFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

const entryId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
)
if (!entryId.value) throw createError({ statusCode: 404 })

const { data, error: fetchError } = await useFetch<{ data: AdminActivityEntry }>(
  `/api/admin/activity/${entryId.value}`,
  { headers: localeApiHeaders }
)

if (fetchError.value || !data.value) {
  if (import.meta.client) {
    toast.add({ title: t('admin.activity.toast.notFound'), color: 'error' })
  }
  await navigateTo(localePath(ADMIN_ROUTES.activity))
}

const entry = computed(() => data.value?.data ?? null)

const hasUnsavedChanges = () =>
  !allowNavigationWithoutPrompt.value && Boolean(activityFormRef.value?.hasUnsavedChanges)

const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedChanges()) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnloadHandler))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))
onBeforeRouteLeave(() => {
  if (!hasUnsavedChanges()) return true
  return window.confirm(t('admin.activity.unsavedChangesPrompt'))
})

const showConflictToast = () =>
  toast.add({
    title: t('admin.activity.toast.conflictTitle'),
    description: t('admin.activity.toast.conflictDescription'),
    color: 'warning',
  })

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/activity/${entryId.value}`, {
      method: 'PUT',
      body: { ...payload, updatedAt: entry.value?.updatedAt },
    })
    await refreshAllClientAsyncData()
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: t('admin.activity.toast.updated'), color: 'success' })
    router.push(localePath(ADMIN_ROUTES.activity))
  } catch (e: unknown) {
    if (getApiErrorStatusCode(e) === 409) {
      showConflictToast()
    } else {
      toast.add({
        title: getApiErrorMessage(e, t('admin.activity.toast.updateError')),
        color: 'error',
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

// Standalone re-snapshot: re-freezes the organiser from the live org-chart without other edits.
const handleRefreshSnapshot = async () => {
  if (!entry.value) return
  isRefreshingSnapshot.value = true
  try {
    const response = await $fetch<{ data: AdminActivityEntry }>(
      `/api/admin/activity/${entryId.value}`,
      {
        method: 'PUT',
        body: {
          kind: entry.value.kind,
          image: entry.value.image,
          startDate: entry.value.startDate,
          endDate: entry.value.endDate,
          isOnline: entry.value.isOnline,
          location: entry.value.location,
          memberOrgSource: entry.value.memberOrgSource,
          memberOrgId: entry.value.memberOrgId,
          active: entry.value.active,
          translations: entry.value.translations,
          updatedAt: entry.value.updatedAt,
          refreshSnapshot: true,
        },
      }
    )
    if (data.value) data.value = { data: response.data }
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.activity.toast.snapshotRefreshed'), color: 'success' })
  } catch (e: unknown) {
    if (getApiErrorStatusCode(e) === 409) {
      showConflictToast()
    } else {
      toast.add({
        title: getApiErrorMessage(e, t('admin.activity.toast.snapshotRefreshError')),
        color: 'error',
      })
    }
  } finally {
    isRefreshingSnapshot.value = false
  }
}

const handleCancel = () => {
  allowNavigationWithoutPrompt.value = true
  router.push(localePath(ADMIN_ROUTES.activity))
}
</script>

<template>
  <div>
    <AdminActivityForm
      ref="activityFormRef"
      :entry="entry"
      :submitting="isSubmitting"
      :refreshing-snapshot="isRefreshingSnapshot"
      @submit="handleSubmit"
      @refresh-snapshot="handleRefreshSnapshot"
      @cancel="handleCancel"
    />
  </div>
</template>
