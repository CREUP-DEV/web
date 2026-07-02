<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { ACTIVITY_KINDS } from '~~/shared/constants/activity'
import type { AdminActivityKind } from '@/composables/admin/useAdminActivity'

definePageMeta({
  layout: 'admin',
  title: 'Crear entrada de actividad',
})

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useAdminToast()
const route = useRoute()
const router = useRouter()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const isSubmitting = ref(false)
const activityFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

const validKinds: AdminActivityKind[] = [...ACTIVITY_KINDS]
const initialKind = computed<AdminActivityKind>(() => {
  const requested = String(route.query.kind ?? '')
  return validKinds.includes(requested as AdminActivityKind)
    ? (requested as AdminActivityKind)
    : 'creup'
})

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

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/activity', { method: 'POST', body: payload })
    await refreshAllClientAsyncData()
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: t('admin.activity.toast.created'), color: 'success' })
    router.push(localePath(ADMIN_ROUTES.activity))
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.activity.toast.createError')),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
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
      :initial-kind="initialKind"
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
