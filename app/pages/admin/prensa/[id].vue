<script setup lang="ts">
import type { AdminPressArticleDetailResponse } from '@/types/adminPress'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'

definePageMeta({
  layout: 'admin',
})

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const isSubmitting = ref(false)
const pressFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

const articleId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
)
if (!articleId.value) throw createError({ statusCode: 404 })

const { data, error: fetchError } = await useFetch<AdminPressArticleDetailResponse>(
  `/api/admin/press/${articleId.value}`,
  { headers: localeApiHeaders }
)

if (fetchError.value || !data.value) {
  if (import.meta.client) {
    toast.add({ title: t('admin.press.toast.notFound'), color: 'error' })
  }

  await navigateTo(localePath(ADMIN_ROUTES.press))
}

const article = computed(() => data.value?.data ?? null)

const hasUnsavedPressChanges = () =>
  !allowNavigationWithoutPrompt.value && Boolean(pressFormRef.value?.hasUnsavedChanges)

useUnsavedChangesGuard(hasUnsavedPressChanges, () => t('admin.press.unsavedChangesPrompt'))

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/press/${articleId.value}`, {
      method: 'PUT',
      headers: localeApiHeaders.value,
      body: { ...payload, updatedAt: article.value?.updatedAt },
    })
    await refreshAllClientAsyncData()
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: t('admin.press.toast.updated'), color: 'success' })
    router.push(localePath(ADMIN_ROUTES.press))
  } catch (e: unknown) {
    const status = getApiErrorStatusCode(e)
    if (status === 409) {
      toast.add({
        title: t('admin.press.toast.conflictTitle'),
        description: t('admin.press.toast.conflictDescription'),
        color: 'warning',
      })
    } else {
      toast.add({
        title: getApiErrorMessage(e, t('admin.press.toast.updateError')),
        color: 'error',
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  allowNavigationWithoutPrompt.value = true
  router.push(localePath(ADMIN_ROUTES.press))
}
</script>

<template>
  <AdminPressForm
    ref="pressFormRef"
    :article="article"
    :submitting="isSubmitting"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>
