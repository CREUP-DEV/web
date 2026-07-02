<script setup lang="ts">
import type { AdminAreaReport } from '@/composables/admin/useAdminAreaReports'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'

definePageMeta({
  layout: 'admin',
  title: 'Editar informe de área',
})

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const isSubmitting = ref(false)
const reportFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

const reportId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
)
if (!reportId.value) throw createError({ statusCode: 404 })

const { data, error: fetchError } = await useFetch<{ data: AdminAreaReport }>(
  `/api/admin/area-reports/${reportId.value}`,
  { headers: localeApiHeaders }
)

if (fetchError.value || !data.value) {
  if (import.meta.client) {
    toast.add({ title: t('admin.areaReports.toast.notFound'), color: 'error' })
  }
  await navigateTo(localePath(ADMIN_ROUTES.activityReports))
}

const report = computed(() => data.value?.data ?? null)

const hasUnsavedChanges = () =>
  !allowNavigationWithoutPrompt.value && Boolean(reportFormRef.value?.hasUnsavedChanges)

const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedChanges()) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnloadHandler))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))
onBeforeRouteLeave(() => {
  if (!hasUnsavedChanges()) return true
  return window.confirm(t('admin.areaReports.unsavedChangesPrompt'))
})

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/area-reports/${reportId.value}`, {
      method: 'PUT',
      body: { ...payload, updatedAt: report.value?.updatedAt },
    })
    await refreshAllClientAsyncData()
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: t('admin.areaReports.toast.updated'), color: 'success' })
    router.push(localePath(ADMIN_ROUTES.activityReports))
  } catch (e: unknown) {
    // 409 covers overlap / duplicate / optimistic lock — surface the server message verbatim.
    const fallback =
      getApiErrorStatusCode(e) === 409
        ? t('admin.areaReports.toast.conflictFallback')
        : t('admin.areaReports.toast.updateError')
    toast.add({ title: getApiErrorMessage(e, fallback), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  allowNavigationWithoutPrompt.value = true
  router.push(localePath(ADMIN_ROUTES.activityReports))
}
</script>

<template>
  <div>
    <AdminAreaReportForm
      ref="reportFormRef"
      :report="report"
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
