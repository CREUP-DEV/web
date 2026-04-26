import type { ComputedRef, Ref } from 'vue'

interface AdminCollectionEntity {
  id: string
}

interface UseAdminCollectionStateOptions<T extends AdminCollectionEntity> {
  items: Ref<T[]> | ComputedRef<T[]>
  persistOrder?: (updates: Array<{ id: string; order: number }>) => Promise<void>
  prepareCreate: () => void
  prepareEdit: (item: T) => void
}

export function useAdminCollectionState<T extends AdminCollectionEntity>(
  options: UseAdminCollectionStateOptions<T>
) {
  const showModal = ref(false)
  const editingItem = ref<T | null>(null)
  const showDeleteModal = ref(false)
  const itemToDelete = ref<T | null>(null)
  const listRef = ref<HTMLElement | null>(null)

  const reorderState = options.persistOrder
    ? useReorderableAdminList({
        items: options.items,
        listRef,
        persist: options.persistOrder,
      })
    : {
        cancelOrderChanges: () => {},
        hasOrderChanges: computed(() => false),
        isSavingOrder: ref(false),
        localItems: computed(() => options.items.value),
        persistOrder: async () => {},
      }

  const openCreate = () => {
    options.prepareCreate()
    editingItem.value = null
    showModal.value = true
  }

  const openEdit = (item: T) => {
    options.prepareEdit(item)
    editingItem.value = item
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
  }

  const confirmDelete = (item: T) => {
    itemToDelete.value = item
    showDeleteModal.value = true
  }

  const closeDeleteModal = () => {
    showDeleteModal.value = false
    itemToDelete.value = null
  }

  return {
    closeDeleteModal,
    closeModal,
    confirmDelete,
    editingItem,
    itemToDelete,
    listRef,
    openCreate,
    openEdit,
    showDeleteModal,
    showModal,
    ...reorderState,
  }
}
