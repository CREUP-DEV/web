<script setup lang="ts">
import { useAuth } from '@/composables/security/useAuth'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

definePageMeta({
  layout: false,
  title: 'Acceso',
})

const { t } = useI18n()

useHead({
  title: () => t('admin.login.title'),
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} | Admin CREUP` : 'Admin CREUP'),
})

const { session, signInWithGoogle, signOut } = useAuth()
const localePath = useLocalePath()
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
    await navigateTo(localePath(ADMIN_ROUTES.dashboard))
  } catch {
    error.value = t('admin.login.errorNoPermission')
  } finally {
    isCheckingAccess.value = false
  }
}

watch(
  () => route.query.error,
  (queryError) => {
    if (typeof queryError === 'string' && queryError.length > 0) {
      error.value = t('admin.login.errorAccountSignIn')
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
  } catch {
    error.value = t('admin.login.errorSignInUnavailable')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="bg-background flex min-h-screen items-center justify-center px-4">
    <section
      aria-labelledby="admin-login-title"
      class="bg-surface w-full max-w-sm space-y-6 rounded-2xl p-8 shadow-xl"
    >
      <header class="text-center">
        <h1 id="admin-login-title" class="text-2xl font-bold">{{ t('admin.login.title') }}</h1>
        <p class="text-muted mt-2 text-sm">{{ t('admin.login.subtitle') }}</p>
      </header>

      <UAlert v-if="error" color="error" :title="error" class="mt-4" />

      <UButton
        block
        size="lg"
        :loading="isLoading"
        :disabled="isCheckingAccess || isLoggedIn"
        icon="i-tabler-brand-google"
        @click="handleLogin"
      >
        {{ t('admin.login.signInWithGoogle') }}
      </UButton>

      <p v-if="isCheckingAccess" class="text-muted text-center text-sm">
        {{ t('admin.login.checkingAccess') }}
      </p>

      <UButton
        v-if="isLoggedIn && !isCheckingAccess && error"
        block
        variant="ghost"
        icon="i-tabler-logout"
        @click="signOut"
      >
        {{ t('admin.login.signOut') }}
      </UButton>
    </section>
  </main>
</template>
