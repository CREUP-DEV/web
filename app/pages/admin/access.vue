<script setup lang="ts">
/**
 * Admin access management page
 */
definePageMeta({
  layout: 'admin',
})

const { error: authError } = await useFetch('/api/admin/session')
if (authError.value) {
  navigateTo('/admin/login')
}

const toast = useToast()

interface AdminAccessItem {
  id: string
  databaseId: string | null
  email: string
  name: string | null
  image: string | null
  active: boolean
  protectedByEnv: boolean
  source: 'env' | 'database' | 'both'
  lastAccessAt: string | null
  createdAt: string | null
}

interface AdminAccessResponse {
  items: AdminAccessItem[]
  summary: {
    total: number
    active: number
    env: number
  }
}

const { data, refresh, pending } = await useFetch<AdminAccessResponse>('/api/admin/access')

const items = computed(() => data.value?.items ?? [])
const summary = computed(() => data.value?.summary ?? { total: 0, active: 0, env: 0 })

const showCreateModal = ref(false)
const isSubmitting = ref(false)
const isTogglingId = ref<string | null>(null)
const isDeleting = ref(false)
const itemToDelete = ref<AdminAccessItem | null>(null)

const form = reactive({
  email: '',
})

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'data' in error) {
    const errorData = (error as { data?: { message?: string } }).data
    if (errorData?.message) {
      return errorData.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

const formatLastAccess = (value: string | null) => {
  if (!value) {
    return 'Todavía no ha iniciado sesión'
  }

  return dateFormatter.format(new Date(value))
}

const getSourceLabel = (source: AdminAccessItem['source']) => {
  switch (source) {
    case 'both':
      return 'Base de datos y .env'
    case 'env':
      return 'Desde .env'
    default:
      return 'Desde panel'
  }
}

const openCreateModal = () => {
  form.email = ''
  showCreateModal.value = true
}

const handleCreate = async () => {
  isSubmitting.value = true

  try {
    await $fetch('/api/admin/access', {
      method: 'POST',
      body: {
        email: form.email,
      },
    })

    showCreateModal.value = false
    await refresh()
    toast.add({ title: 'Acceso añadido', color: 'success' })
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'No se pudo añadir el acceso'),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const toggleAccess = async (item: AdminAccessItem) => {
  if (!item.databaseId) {
    return
  }

  isTogglingId.value = item.id

  try {
    await $fetch(`/api/admin/access/${item.databaseId}`, {
      method: 'PATCH',
      body: {
        active: !item.active,
      },
    })

    await refresh()
    toast.add({
      title: item.active ? 'Acceso desactivado' : 'Acceso activado',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'No se pudo actualizar el acceso'),
      color: 'error',
    })
  } finally {
    isTogglingId.value = null
  }
}

const confirmDelete = (item: AdminAccessItem) => {
  itemToDelete.value = item
}

const handleDelete = async () => {
  if (!itemToDelete.value?.databaseId) {
    return
  }

  isDeleting.value = true

  try {
    await $fetch(`/api/admin/access/${itemToDelete.value.databaseId}`, {
      method: 'DELETE',
    })

    itemToDelete.value = null
    await refresh()
    toast.add({ title: 'Acceso eliminado', color: 'success' })
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'No se pudo eliminar el acceso'),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">Accesos al panel</h1>
        <p class="text-muted mt-2 max-w-2xl text-sm">
          Autoriza correos concretos para iniciar sesión con Google. Los accesos definidos en
          <code>.env</code> son permanentes desde el panel y deben eliminarse allí primero.
        </p>
      </div>

      <UButton icon="i-tabler-plus" @click="openCreateModal">Añadir correo</UButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="bg-surface rounded-2xl border p-4">
        <p class="text-muted text-sm">Accesos totales</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.total }}</p>
      </div>
      <div class="bg-surface rounded-2xl border p-4">
        <p class="text-muted text-sm">Activos</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.active }}</p>
      </div>
      <div class="bg-surface rounded-2xl border p-4">
        <p class="text-muted text-sm">Protegidos por .env</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.env }}</p>
      </div>
    </div>

    <div v-if="pending" class="text-muted py-12 text-center">Cargando accesos...</div>

    <div v-else class="space-y-4">
      <div v-for="item in items" :key="item.id" class="bg-surface rounded-2xl border p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">
            <div
              class="bg-muted flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
            >
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.name ? `Foto de perfil de ${item.name}` : 'Foto de perfil de Google'"
                class="size-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <UIcon v-else name="i-tabler-user" class="text-muted size-7" />
            </div>

            <div class="min-w-0 space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold">
                  {{ item.name || 'Pendiente de primer inicio de sesión' }}
                </h2>
                <UBadge :color="item.active ? 'success' : 'neutral'" variant="soft">
                  {{ item.active ? 'Activo' : 'Inactivo' }}
                </UBadge>
                <UBadge color="info" variant="soft">
                  {{ getSourceLabel(item.source) }}
                </UBadge>
              </div>

              <p class="text-sm font-medium break-all">{{ item.email }}</p>
              <p class="text-muted text-sm">
                Último acceso: {{ formatLastAccess(item.lastAccessAt) }}
              </p>
            </div>
          </div>

          <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <p v-if="item.protectedByEnv" class="text-muted text-sm">
              Este acceso se gestiona desde <code>.env</code>.
            </p>

            <template v-else-if="item.databaseId">
              <UButton
                variant="outline"
                :loading="isTogglingId === item.id"
                @click="toggleAccess(item)"
              >
                {{ item.active ? 'Desactivar' : 'Activar' }}
              </UButton>
              <UButton color="error" variant="ghost" @click="confirmDelete(item)">
                Eliminar
              </UButton>
            </template>
          </div>
        </div>
      </div>

      <div v-if="!items.length" class="text-muted py-12 text-center">
        No hay accesos configurados todavía.
      </div>
    </div>

    <UModal v-model:open="showCreateModal" :ui="{ content: 'sm:max-w-md' }">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold">Añadir acceso</h2>
          <p class="text-muted mt-2 text-sm">
            El acceso se concederá al correo indicado cuando inicie sesión con Google.
          </p>

          <form id="admin-access-form" class="mt-6 space-y-4" @submit.prevent="handleCreate">
            <UFormField label="Correo autorizado">
              <UInput v-model="form.email" class="w-full" placeholder="nombre@dominio.es" />
            </UFormField>
          </form>

          <div class="mt-6 flex justify-end gap-2">
            <UButton variant="ghost" @click="showCreateModal = false">Cancelar</UButton>
            <UButton type="submit" form="admin-access-form" :loading="isSubmitting">
              Guardar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal :open="Boolean(itemToDelete)" @update:open="itemToDelete = null">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">Eliminar acceso</h2>
          </div>

          <p class="text-muted mb-6 text-sm">
            Se eliminará el acceso de <strong>{{ itemToDelete?.email }}</strong> al panel de
            administración.
          </p>

          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="itemToDelete = null">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Eliminar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
