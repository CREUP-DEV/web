import type { Ref } from 'vue'

interface AdminCollectionEnvelope<TItem, TMeta = Record<string, never>> {
  data: TItem[]
  meta?: TMeta
}

interface UseAdminMutableCollectionOptions<TItem> {
  sortItems?: (left: TItem, right: TItem) => number
}

export function useAdminMutableCollection<
  TItem extends { id: string },
  TMeta = Record<string, never>,
>(
  source: Ref<AdminCollectionEnvelope<TItem, TMeta> | null | undefined>,
  options: UseAdminMutableCollectionOptions<TItem> = {}
) {
  const sortItems = (items: TItem[]) => {
    if (!options.sortItems) {
      return items
    }

    return [...items].sort(options.sortItems)
  }

  const items = computed(() => source.value?.data ?? [])

  const setItems = (nextItems: TItem[]) => {
    const sortedItems = sortItems(nextItems)

    if (source.value) {
      source.value = {
        ...source.value,
        data: sortedItems,
      }
      return
    }

    source.value = {
      data: sortedItems,
    } as AdminCollectionEnvelope<TItem, TMeta>
  }

  const replaceItem = (item: TItem) => {
    const existingItems = items.value
    const existingIndex = existingItems.findIndex((entry) => entry.id === item.id)

    if (existingIndex === -1) {
      setItems([...existingItems, item])
      return
    }

    const nextItems = [...existingItems]
    nextItems.splice(existingIndex, 1, item)
    setItems(nextItems)
  }

  const prependItem = (item: TItem) => {
    const existingItems = items.value.filter((entry) => entry.id !== item.id)
    setItems([item, ...existingItems])
  }

  const appendItem = (item: TItem) => {
    const existingItems = items.value.filter((entry) => entry.id !== item.id)
    setItems([...existingItems, item])
  }

  const removeItem = (id: string) => {
    setItems(items.value.filter((item) => item.id !== id))
  }

  const updateItem = (id: string, updater: (item: TItem) => TItem) => {
    const existingItems = items.value
    const existingIndex = existingItems.findIndex((entry) => entry.id === id)

    if (existingIndex === -1) {
      return
    }

    const nextItems = [...existingItems]
    nextItems.splice(existingIndex, 1, updater(nextItems[existingIndex]!))
    setItems(nextItems)
  }

  const updateMeta = (updater: (meta: TMeta | undefined) => TMeta | undefined) => {
    if (!source.value) {
      return
    }

    source.value = {
      ...source.value,
      meta: updater(source.value.meta),
    }
  }

  return {
    appendItem,
    items,
    prependItem,
    removeItem,
    replaceItem,
    setItems,
    updateItem,
    updateMeta,
  }
}
