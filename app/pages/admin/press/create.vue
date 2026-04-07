<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Crear artículo de prensa',
})

const toast = useToast()
const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)

type PressArticleType = 'press_release' | 'statement' | 'media_appearance'

const validPressTypes: PressArticleType[] = ['press_release', 'statement', 'media_appearance']
const initialType = computed<PressArticleType>(() => {
  const requestedType = String(route.query.type ?? '')
  return validPressTypes.includes(requestedType as PressArticleType)
    ? (requestedType as PressArticleType)
    : 'press_release'
})

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/press', {
      method: 'POST',
      body: payload,
    })
    toast.add({ title: 'Artículo creado correctamente', color: 'success' })
    router.push('/admin/press')
  } catch (e) {
    console.error('Error creating article:', e)
    toast.add({ title: 'No se pudo crear el artículo', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  router.push('/admin/press')
}
</script>

<template>
  <div>
    <AdminPressForm
      :initial-type="initialType"
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
