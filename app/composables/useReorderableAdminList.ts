import type { ComputedRef, Ref } from 'vue'
import type Sortable from 'sortablejs'

interface ReorderableAdminEntity {
  id: string
}

interface UseReorderableAdminListOptions<T extends ReorderableAdminEntity> {
  items: Ref<T[]> | ComputedRef<T[]>
  listRef: Ref<HTMLElement | null>
  persist: (updates: Array<{ id: string; order: number }>) => Promise<void>
}

export function useReorderableAdminList<T extends ReorderableAdminEntity>(
  options: UseReorderableAdminListOptions<T>
) {
  const localItems = ref<T[]>([])
  const isSavingOrder = ref(false)
  let sortableInstance: Sortable | null = null

  const hasOrderChanges = computed(() => {
    if (localItems.value.length !== options.items.value.length) {
      return false
    }

    return localItems.value.some((item, index) => item.id !== options.items.value[index]?.id)
  })

  watch(
    options.items,
    (nextItems) => {
      localItems.value = [...nextItems]
    },
    { immediate: true }
  )

  onMounted(() => {
    if (!options.listRef.value) {
      return
    }

    void (async () => {
      const { default: SortableJs } = await import('sortablejs')

      if (!options.listRef.value) {
        return
      }

      sortableInstance = SortableJs.create(options.listRef.value, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'opacity-50',
        onEnd: (event) => {
          if (event.oldIndex === undefined || event.newIndex === undefined) {
            return
          }

          const movedItem = localItems.value.splice(event.oldIndex, 1)[0]
          if (movedItem) {
            localItems.value.splice(event.newIndex, 0, movedItem)
          }
        },
      })
    })
  })

  onUnmounted(() => {
    sortableInstance?.destroy()
  })

  const persistOrder = async () => {
    isSavingOrder.value = true

    try {
      await options.persist(
        localItems.value.map((item, index) => ({
          id: item.id,
          order: index,
        }))
      )
    } finally {
      isSavingOrder.value = false
    }
  }

  const cancelOrderChanges = () => {
    localItems.value = [...options.items.value]
  }

  return {
    cancelOrderChanges,
    hasOrderChanges,
    isSavingOrder,
    localItems,
    persistOrder,
  }
}
