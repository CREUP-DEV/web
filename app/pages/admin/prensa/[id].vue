<script setup lang="ts">
import type { AdminPressArticleDetailResponse } from '@/types/adminPress'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'

definePageMeta({
  layout: 'admin',
  title: 'Editar artículo de prensa',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isSubmitting = ref(false)
const pressFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

const articleId = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
)
if (!articleId.value) throw createError({ statusCode: 404 })

const { data, error: fetchError } = await useFetch<AdminPressArticleDetailResponse>(
  `/api/admin/press/${articleId.value}`
)

if (fetchError.value || !data.value) {
  if (import.meta.client) {
    toast.add({ title: 'No se encontró el artículo', color: 'error' })
  }

  await navigateTo(ADMIN_ROUTES.press)
}

const article = computed(() => data.value?.data ?? null)

const hasUnsavedPressChanges = () =>
  !allowNavigationWithoutPrompt.value && Boolean(pressFormRef.value?.hasUnsavedChanges)

const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  if (!hasUnsavedPressChanges()) return

  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
})

onBeforeRouteLeave(() => {
  if (!hasUnsavedPressChanges()) {
    return true
  }

  return window.confirm('Hay cambios sin guardar. Si sales ahora, se perderán.')
})

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/press/${articleId.value}`, {
      method: 'PUT',
      body: { ...payload, updatedAt: article.value?.updatedAt },
    })
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: 'Artículo actualizado correctamente', color: 'success' })
    router.push(ADMIN_ROUTES.press)
  } catch (e: unknown) {
    const status = getApiErrorStatusCode(e)
    if (status === 409) {
      toast.add({
        title: 'Conflicto al guardar',
        description:
          'El artículo fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
        color: 'warning',
      })
    } else {
      toast.add({
        title: getApiErrorMessage(e, 'No se pudo actualizar el artículo'),
        color: 'error',
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  allowNavigationWithoutPrompt.value = true
  router.push(ADMIN_ROUTES.press)
}
</script>

<template>
  <div>
    <AdminPressForm
      ref="pressFormRef"
      :article="article"
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
