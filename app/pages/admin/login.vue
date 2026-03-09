<script setup lang="ts">
/**
 * Admin Login Page
 */
import { useAuth } from '@/composables/useAuth'

definePageMeta({
  layout: false,
})

const { session, signInWithGoogle, signOut } = useAuth()
const route = useRoute()
const isLoading = ref(false)
const error = ref<string | null>(null)
const isCheckingAccess = ref(false)

const isLoggedIn = computed(() => Boolean(session.value.data?.user))

const verifyAdminAccess = async () => {
  if (!session.value.data?.user) {
    return
  }

  isCheckingAccess.value = true

  try {
    await $fetch('/api/admin/session')
    await navigateTo('/admin')
  } catch {
    error.value = 'Esta cuenta ha iniciado sesión, pero no tiene acceso al panel de administración'
  } finally {
    isCheckingAccess.value = false
  }
}

watch(
  () => route.query.error,
  (queryError) => {
    if (typeof queryError === 'string' && queryError.length > 0) {
      error.value = 'No se pudo completar el inicio de sesión con la cuenta seleccionada'
    }
  },
  { immediate: true }
)

watch(
  () => session.value.data?.user,
  async (user) => {
    if (user) {
      await verifyAdminAccess()
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

      <UAlert
        v-if="isLoggedIn && !isCheckingAccess && error"
        color="warning"
        title="Sesión iniciada sin permisos"
        description="Cierra sesión y accede con una cuenta autorizada para entrar al panel."
      />

      <UButton
        block
        size="lg"
        :loading="isLoading"
        :disabled="isCheckingAccess || isLoggedIn"
        icon="i-tabler-brand-google"
        @click="handleLogin"
      >
        Iniciar sesión con Google
      </UButton>

      <p v-if="isCheckingAccess" class="text-muted text-center text-sm">
        Verificando acceso al panel...
      </p>

      <UButton
        v-if="isLoggedIn && !isCheckingAccess && error"
        block
        variant="ghost"
        icon="i-tabler-logout"
        @click="signOut"
      >
        Cerrar sesión
      </UButton>
    </div>
  </div>
</template>
