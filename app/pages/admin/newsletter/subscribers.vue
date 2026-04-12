<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'

definePageMeta({
  layout: 'admin',
  title: 'Suscriptores de newsletter',
})

interface Subscriber {
  id: string
  email: string
  active: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

const toast = useToast()

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: Subscriber[]
}>('/api/admin/newsletter/subscribers', {
  lazy: true,
})
const allItems = computed(() => data.value?.data ?? [])

// Filter
const showActiveOnly = ref(false)
const items = computed(() =>
  showActiveOnly.value ? allItems.value.filter((s) => s.active) : allItems.value
)

const activeCount = computed(() => allItems.value.filter((s) => s.active).length)
const totalCount = computed(() => allItems.value.length)

// Search
const search = ref('')
const filteredItems = computed(() => {
  if (!search.value.trim()) return items.value
  const q = search.value.trim().toLowerCase()
  return items.value.filter((s) => s.email.toLowerCase().includes(q))
})

// Add subscriber modal
const showAddModal = ref(false)
const newEmail = ref('')
const isAdding = ref(false)

async function handleAdd() {
  if (!newEmail.value.trim() || isAdding.value) return
  isAdding.value = true
  try {
    await $fetch('/api/admin/newsletter/subscribers', {
      method: 'POST',
      body: { email: newEmail.value.trim(), active: true },
    })
    toast.add({ title: 'Suscriptor añadido', color: 'success' })
    showAddModal.value = false
    newEmail.value = ''
    await refresh()
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo añadir el suscriptor'),
      color: 'error',
    })
  } finally {
    isAdding.value = false
  }
}

// Toggle active
async function toggleActive(item: Subscriber) {
  try {
    await $fetch(`/api/admin/newsletter/subscriber/${item.id}`, {
      method: 'PUT',
      body: { email: item.email, active: !item.active },
    })
    await refresh()
    toast.add({
      title: item.active ? 'Suscriptor desactivado' : 'Suscriptor reactivado',
      color: 'success',
    })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo actualizar el suscriptor'),
      color: 'error',
    })
  }
}

// Delete
const showDeleteModal = ref(false)
const itemToDelete = ref<Subscriber | null>(null)
const isDeleting = ref(false)

function confirmDelete(item: Subscriber) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/newsletter/subscriber/${itemToDelete.value.id}`, {
      method: 'DELETE',
    })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({ title: 'Suscriptor eliminado', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo eliminar el suscriptor'),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <UButton to="/admin/newsletter" icon="i-tabler-arrow-left" variant="ghost" size="sm" />
          <h1 class="text-2xl font-bold">Suscriptores</h1>
        </div>
        <p class="text-muted mt-1 text-sm">
          {{ activeCount }} activos de {{ totalCount }} en total
        </p>
      </div>
      <UButton icon="i-tabler-plus" @click="showAddModal = true">Añadir</UButton>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        icon="i-tabler-search"
        placeholder="Buscar por correo…"
        aria-label="Buscar suscriptores por correo electrónico"
        class="w-full max-w-xs"
      />
      <UButton
        :variant="showActiveOnly ? 'solid' : 'outline'"
        size="sm"
        :aria-pressed="showActiveOnly"
        @click="showActiveOnly = !showActiveOnly"
      >
        Solo activos
      </UButton>
    </div>

    <div v-if="pending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-16 w-full rounded-xl" />
      <USkeleton class="h-16 w-full rounded-xl" />
      <USkeleton class="h-16 w-full rounded-xl" />
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudieron cargar los suscriptores"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
      </UButton>
    </div>

    <div v-else-if="filteredItems.length === 0" class="py-12 text-center">
      <p class="text-muted">
        No hay suscriptores{{ search ? ' que coincidan con la búsqueda' : '' }}.
      </p>
      <UButton
        v-if="!search"
        class="mt-4"
        size="sm"
        icon="i-tabler-plus"
        @click="showAddModal = true"
      >
        Añadir suscriptor
      </UButton>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-surface ring-default flex items-center gap-4 rounded-lg px-4 py-3 ring-1"
      >
        <div class="flex-1 overflow-hidden">
          <p class="truncate font-medium">{{ item.email }}</p>
          <p class="text-muted text-xs">
            Suscrito {{ formatDate(item.subscribedAt) }}
            <template v-if="item.unsubscribedAt">
              · Baja {{ formatDate(item.unsubscribedAt) }}
            </template>
          </p>
        </div>
        <span
          :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
          class="shrink-0 rounded-full px-2 py-0.5 text-xs"
        >
          {{ item.active ? 'Activo' : 'Inactivo' }}
        </span>
        <div class="flex gap-1">
          <UTooltip :text="item.active ? 'Desactivar' : 'Reactivar'">
            <UButton
              :icon="item.active ? 'i-tabler-user-minus' : 'i-tabler-user-plus'"
              variant="ghost"
              size="sm"
              @click="toggleActive(item)"
            />
          </UTooltip>
          <UTooltip text="Eliminar">
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              @click="confirmDelete(item)"
            />
          </UTooltip>
        </div>
      </div>
    </div>

    <UModal v-model:open="showAddModal">
      <template #header>
        <h2 class="text-lg font-semibold">Añadir suscriptor</h2>
      </template>
      <template #body>
        <form class="space-y-4" @submit.prevent="handleAdd">
          <p class="text-dimmed text-sm">
            Añade suscriptores manualmente solo si ya dispones de una base legítima y puedes
            acreditar el consentimiento.
          </p>
          <UFormField label="Correo electrónico *">
            <UInput
              v-model="newEmail"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="showAddModal = false">Cancelar</UButton>
            <UButton type="submit" :loading="isAdding" :disabled="!newEmail.trim()">
              Añadir
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">Eliminar suscriptor</h2>
          </div>
          <p class="text-muted mb-6">
            ¿Seguro que quieres eliminar permanentemente a
            <strong>{{ itemToDelete?.email }}</strong
            >?
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Eliminar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
