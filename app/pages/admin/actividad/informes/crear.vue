<script setup lang="ts">
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

definePageMeta({
  layout: 'admin',
  title: 'Crear informe de área',
})

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useAdminToast()
const router = useRouter()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const isSubmitting = ref(false)
const reportFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

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
    await $fetch('/api/admin/area-reports', { method: 'POST', body: payload })
    await refreshAllClientAsyncData()
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: t('admin.areaReports.toast.created'), color: 'success' })
    router.push(localePath(ADMIN_ROUTES.activityReports))
  } catch (e: unknown) {
    // 409 covers overlap / duplicate / optimistic lock — surface the server message verbatim.
    const fallback =
      getApiErrorStatusCode(e) === 409
        ? t('admin.areaReports.toast.conflictFallback')
        : t('admin.areaReports.toast.createError')
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
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
