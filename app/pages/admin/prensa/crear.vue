<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { PRESS_ARTICLE_TYPES } from '~~/shared/constants/pressTypes'

definePageMeta({
  layout: 'admin',
  title: 'Crear artículo de prensa',
})

const toast = useToast()
const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)
const pressFormRef = ref<{ hasUnsavedChanges?: boolean } | null>(null)
const allowNavigationWithoutPrompt = ref(false)

type PressArticleType = (typeof PRESS_ARTICLE_TYPES)[number]

const validPressTypes: PressArticleType[] = [...PRESS_ARTICLE_TYPES]
const initialType = computed<PressArticleType>(() => {
  const requestedType = String(route.query.type ?? '')
  return validPressTypes.includes(requestedType as PressArticleType)
    ? (requestedType as PressArticleType)
    : 'press_release'
})

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
    await $fetch('/api/admin/press', {
      method: 'POST',
      body: payload,
    })
    allowNavigationWithoutPrompt.value = true
    toast.add({ title: 'Artículo creado correctamente', color: 'success' })
    router.push(ADMIN_ROUTES.press)
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'No se pudo crear el artículo'), color: 'error' })
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
      :initial-type="initialType"
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
