<script setup lang="ts">
/**
 * Admin page for creating a new press article.
 * Uses AdminPressForm for the form logic and provides a full-page editing experience.
 */
definePageMeta({
  layout: 'admin',
})

const { error: authError } = await useFetch('/api/admin/session')
if (authError.value) {
  navigateTo('/admin/login')
}

const toast = useToast()
const router = useRouter()
const isSubmitting = ref(false)

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
    <AdminPressForm :submitting="isSubmitting" @submit="handleSubmit" @cancel="handleCancel" />
  </div>
</template>
