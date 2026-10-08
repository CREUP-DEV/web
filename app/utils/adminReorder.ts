/** Response of the admin `reorder` endpoints (`reorderCollection` on the server). */
export interface AdminReorderResponse {
  data: {
    success: boolean
    /** The `updatedAt` the reorder stamped on each reordered row. */
    items?: Array<{ id: string; updatedAt: string | null }>
  }
}

/**
 * Applies a saved reorder to the loaded items: their new `order`, and the new `updatedAt` the
 * server stamped on every reordered row. The next edit or delete sends that `updatedAt` as its
 * optimistic-lock version, so keeping the old one would make it fail as a concurrent change.
 */
export function applyAdminReorder<T extends { id: string; order: number; updatedAt: string }>(
  items: T[],
  updates: Array<{ id: string; order: number }>,
  response: AdminReorderResponse
): T[] {
  const orderById = new Map(updates.map((update) => [update.id, update.order]))
  const updatedAtById = new Map(
    (response.data.items ?? []).map((item) => [item.id, item.updatedAt])
  )

  return items.map((item) => {
    const order = orderById.get(item.id)
    const updatedAt = updatedAtById.get(item.id)

    if (order === undefined && !updatedAt) {
      return item
    }

    return { ...item, order: order ?? item.order, updatedAt: updatedAt ?? item.updatedAt }
  })
}
