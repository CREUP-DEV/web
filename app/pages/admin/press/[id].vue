<script setup lang="ts">
/**
 * Admin page for editing an existing press article.
 * Fetches the article by ID and uses AdminPressForm for form logic.
 */
definePageMeta({
  layout: 'admin',
})

const { error: authError } = await useFetch('/api/admin/session')
if (authError.value) {
  navigateTo('/admin/login')
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isSubmitting = ref(false)

const articleId = computed(() => route.params.id as string)

const { data, error: fetchError } = await useFetch(`/api/admin/press/${articleId.value}`)

if (fetchError.value || !data.value) {
  toast.add({ title: 'No se encontró el artículo', color: 'error' })
  navigateTo('/admin/press')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const article = computed(() => (data.value as any)?.item ?? null)

const handleSubmit = async (payload: Record<string, unknown>) => {
  isSubmitting.value = true
  try {
    await $fetch(`/api/admin/press/${articleId.value}`, {
      method: 'PUT',
      body: payload,
    })
    toast.add({ title: 'Artículo actualizado correctamente', color: 'success' })
    router.push('/admin/press')
  } catch (e) {
    console.error('Error updating article:', e)
    toast.add({ title: 'No se pudo actualizar el artículo', color: 'error' })
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
      :article="article as any"
      :submitting="isSubmitting"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>
