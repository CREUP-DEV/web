<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createAdminAccessClientSchema } from '~~/shared/utils/adminClientSchemas'
import { getInitials } from '@/utils/initials'

definePageMeta({
  layout: 'admin',
  title: 'Accesos',
})

const toast = useToast()
const { clearErrors, getFieldError, validate } = useFormValidation()

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
  data: AdminAccessItem[]
  meta: {
    total: number
    active: number
    env: number
  }
}

interface CreateAdminAccessResponse {
  data: {
    id: string
    email: string
    active: boolean
    createdAt: string
  }
}

const {
  data,
  error: fetchError,
  refresh,
  pending,
} = await useFetch<AdminAccessResponse>('/api/admin/access')

const items = computed(() => data.value?.data ?? [])
const summary = computed(() => data.value?.meta ?? { total: 0, active: 0, env: 0 })
const isInitialLoading = computed(() => pending.value && !data.value && !fetchError.value)

const isSubmitting = ref(false)
const isTogglingId = ref<string | null>(null)
const isDeleting = ref(false)
const accessImageFailures = reactive<Record<string, boolean>>({})
const accessImageLoaded = reactive<Record<string, boolean>>({})

const form = reactive({
  email: '',
})

const buildCreatePayload = () => ({
  active: true,
  email: form.email.trim(),
})

const normalizeAccessEmail = (value: string) => value.trim().toLowerCase()

const sortAccessItems = (left: AdminAccessItem, right: AdminAccessItem) => {
  if (left.protectedByEnv !== right.protectedByEnv) {
    return left.protectedByEnv ? -1 : 1
  }

  const rightLastAccess = right.lastAccessAt ? new Date(right.lastAccessAt).getTime() || 0 : 0
  const leftLastAccess = left.lastAccessAt ? new Date(left.lastAccessAt).getTime() || 0 : 0

  if (leftLastAccess !== rightLastAccess) {
    return rightLastAccess - leftLastAccess
  }

  return left.email.localeCompare(right.email, 'es')
}

const setSummaryActive = (nextActive: number) => {
  if (!data.value) {
    return
  }

  data.value.meta.active = Math.max(0, Math.min(data.value.meta.total, nextActive))
}

const buildCreatePayloadSnapshot = () => JSON.stringify(buildCreatePayload())

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildCreatePayloadSnapshot)

const {
  closeDeleteModal,
  closeModal,
  confirmDelete,
  itemToDelete,
  openCreate,
  showDeleteModal,
  showModal,
} = useAdminCollectionState<AdminAccessItem>({
  items,
  prepareCreate: () => {
    clearErrors()
    form.email = ''
    resetFormSnapshot()
  },
  prepareEdit: () => {},
})

const isCreateFormValid = computed(
  () => createAdminAccessClientSchema.safeParse(buildCreatePayload()).success
)

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

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

const getAccessInitials = (item: AdminAccessItem) => {
  return getInitials(item.name?.trim() || item.email.trim())
}

const markAccessImageFailed = (id: string) => {
  accessImageFailures[id] = true
}

const markAccessImageLoaded = (id: string) => {
  accessImageLoaded[id] = true
}

const handleCreate = async () => {
  const payload = buildCreatePayload()

  if (!hasFormChanges.value) {
    closeModal()
    clearErrors()
    return
  }

  if (!validate(createAdminAccessClientSchema, payload)) {
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch<CreateAdminAccessResponse>('/api/admin/access', {
      method: 'POST',
      body: payload,
    })

    if (data.value) {
      const normalizedEmail = normalizeAccessEmail(response.data.email)
      const existingItem = data.value.data.find(
        (item) => normalizeAccessEmail(item.email) === normalizedEmail
      )

      if (existingItem) {
        existingItem.id = response.data.id
        existingItem.databaseId = response.data.id
        existingItem.source = existingItem.protectedByEnv ? 'both' : existingItem.source
        existingItem.active = true
        existingItem.createdAt = response.data.createdAt
      } else {
        data.value.data.push({
          id: response.data.id,
          databaseId: response.data.id,
          email: response.data.email,
          name: null,
          image: null,
          active: response.data.active,
          protectedByEnv: false,
          source: 'database',
          lastAccessAt: null,
          createdAt: response.data.createdAt,
        })
        data.value.meta.total += 1
        if (response.data.active) {
          setSummaryActive(data.value.meta.active + 1)
        }
      }

      data.value.data.sort(sortAccessItems)
    }

    closeModal()
    toast.add({ title: 'Acceso añadido', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo añadir el acceso'),
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

  const previousActive = item.active
  const nextActive = !previousActive

  item.active = nextActive
  if (data.value) {
    setSummaryActive(data.value.meta.active + (nextActive ? 1 : -1))
  }

  isTogglingId.value = item.id

  try {
    await $fetch(`/api/admin/access/${item.databaseId}`, {
      method: 'PUT',
      body: {
        active: nextActive,
      },
    })

    toast.add({
      title: nextActive ? 'Acceso activado' : 'Acceso desactivado',
      color: 'success',
    })
  } catch (error) {
    item.active = previousActive
    if (data.value) {
      setSummaryActive(data.value.meta.active + (previousActive ? 1 : -1))
    }

    toast.add({
      title: getApiErrorMessage(error, 'No se pudo actualizar el acceso'),
      color: 'error',
    })
  } finally {
    isTogglingId.value = null
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value?.databaseId) {
    return
  }

  const targetId = itemToDelete.value.id

  isDeleting.value = true

  try {
    await $fetch(`/api/admin/access/${itemToDelete.value.databaseId}`, {
      method: 'DELETE',
    })

    if (data.value) {
      const index = data.value.data.findIndex((item) => item.id === targetId)
      if (index >= 0) {
        const [removed] = data.value.data.splice(index, 1)
        data.value.meta.total = Math.max(0, data.value.meta.total - 1)

        if (removed?.active) {
          setSummaryActive(data.value.meta.active - 1)
        }

        accessImageFailures[targetId] = false
        accessImageLoaded[targetId] = false
      }
    }

    closeDeleteModal()
    toast.add({ title: 'Acceso eliminado', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo eliminar el acceso'),
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
          <code>.env</code> son permanentes desde el panel y deben eliminarse desde allí.
        </p>
      </div>

      <UButton icon="i-tabler-plus" @click="openCreate">Añadir correo</UButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="bg-surface rounded-2xl p-4">
        <p class="text-muted text-sm">Accesos totales</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.total }}</p>
      </div>
      <div class="bg-surface rounded-2xl p-4">
        <p class="text-muted text-sm">Activos</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.active }}</p>
      </div>
      <div class="bg-surface rounded-2xl p-4">
        <p class="text-muted text-sm">Protegidos por .env</p>
        <p class="mt-2 text-2xl font-semibold">{{ summary.env }}</p>
      </div>
    </div>

    <div v-if="isInitialLoading" aria-hidden="true" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-3">
        <div v-for="n in 3" :key="n" class="bg-surface rounded-2xl p-4">
          <USkeleton class="h-4 w-24" />
          <USkeleton class="mt-3 h-8 w-16" />
        </div>
      </div>

      <div class="space-y-4">
        <div v-for="n in 4" :key="n" class="bg-surface rounded-2xl p-5 shadow-sm">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4">
              <USkeleton class="size-14 shrink-0 rounded-full" />
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <USkeleton class="h-5 w-48" />
                  <USkeleton class="h-5 w-16 rounded-full" />
                  <USkeleton class="h-5 w-28 rounded-full" />
                </div>
                <USkeleton class="h-4 w-56" />
                <USkeleton class="h-4 w-44" />
              </div>
            </div>

            <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
              <USkeleton class="h-4 w-40" />
              <div class="flex gap-2">
                <USkeleton class="h-9 w-24 rounded-md" />
                <USkeleton class="h-9 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudieron cargar los accesos"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
      </UButton>
    </div>

    <div v-else class="space-y-4">
      <TransitionGroup
        v-if="items.length"
        name="access-list"
        tag="div"
        class="relative flex flex-col gap-4"
      >
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-surface rounded-2xl p-5 shadow-sm transition-opacity"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-4">
              <div
                class="bg-muted text-muted-foreground relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
              >
                <span class="text-sm font-semibold">
                  {{ getAccessInitials(item) }}
                </span>
                <img
                  v-if="item.image && !accessImageFailures[item.id]"
                  :src="item.image"
                  alt=""
                  aria-hidden="true"
                  class="absolute inset-0 size-full object-cover transition-opacity"
                  :class="accessImageLoaded[item.id] ? 'opacity-100' : 'opacity-0'"
                  loading="lazy"
                  decoding="async"
                  @load="markAccessImageLoaded(item.id)"
                  @error="markAccessImageFailed(item.id)"
                />
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
      </TransitionGroup>

      <div v-if="!items.length" class="py-12 text-center">
        <p class="text-muted">No hay accesos configurados todavía.</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          Añadir acceso
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-md' }">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold">Añadir acceso</h2>
          <p class="text-muted mt-2 text-sm">
            El acceso se concederá al correo indicado cuando inicie sesión con Google.
          </p>

          <form id="admin-access-form" class="mt-6 space-y-4" @submit.prevent="handleCreate">
            <UFormField label="Correo autorizado" :error="getFieldError('email')">
              <UInput
                v-model="form.email"
                type="email"
                class="w-full"
                placeholder="nombre@dominio.es"
                @update:model-value="clearErrors"
              />
            </UFormField>
          </form>

          <div class="mt-6 flex justify-end gap-2">
            <UButton variant="ghost" @click="closeModal">Cancelar</UButton>
            <UButton
              type="submit"
              form="admin-access-form"
              :loading="isSubmitting"
              :disabled="!hasFormChanges || !isCreateFormValid || isSubmitting"
            >
              Guardar
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal">
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
            <UButton variant="ghost" @click="closeDeleteModal">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Eliminar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.access-list-enter-active,
.access-list-leave-active,
.access-list-move {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.access-list-enter-from,
.access-list-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.access-list-leave-active {
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
}
</style>
