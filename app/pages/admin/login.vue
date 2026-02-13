<script setup lang="ts">
/**
 * Admin Login Page
 */
import { useAuth } from '@/composables/useAuth'

definePageMeta({
  layout: false,
})

const { session, signInWithGoogle } = useAuth()
const isLoading = ref(false)
const error = ref<string | null>(null)

// Redirect if already logged in
watch(
  () => session.value.data?.user,
  (user) => {
    if (user) {
      navigateTo('/admin')
    }
  },
  { immediate: true }
)

const handleLogin = async () => {
  try {
    isLoading.value = true
    error.value = null
    await signInWithGoogle()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error al iniciar sesión'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-background flex min-h-screen items-center justify-center px-4">
    <div class="bg-surface w-full max-w-sm space-y-6 rounded-2xl p-8 shadow-xl">
      <div class="text-center">
        <h1 class="text-2xl font-bold">Administración</h1>
        <p class="text-muted mt-2 text-sm">Inicia sesión para acceder al panel de administración</p>
      </div>

      <UAlert v-if="error" color="error" :title="error" class="mt-4" />

      <UButton
        block
        size="lg"
        :loading="isLoading"
        icon="i-tabler-brand-google"
        @click="handleLogin"
      >
        Iniciar sesión con Google
      </UButton>
    </div>
  </div>
</template>
