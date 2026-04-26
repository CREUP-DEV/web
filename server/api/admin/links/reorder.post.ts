import { defineEventHandler, readBody } from 'h3'
import { inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks } from '../../../db/schema'
import {
  assertCompleteReorderSet,
  buildReorderOrderExpression,
} from '../../../utils/admin/adminReorder'
import { invalidateHomeDataCache } from '../../../utils/admin/adminCacheInvalidation'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder featured links
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const validated = validateBody(updateOrderSchema, body)
  const reorderedIds = validated.items.map((item) => item.id)
  const reorderedOrder = buildReorderOrderExpression(
    featuredLinks.id,
    featuredLinks.order,
    validated.items
  )

  // Update all items in a transaction
  await db.transaction(async (tx) => {
    const existingItems = await tx
      .select({ id: featuredLinks.id })
      .from(featuredLinks)
      .for('update')

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    if (validated.items.length > 0) {
      await tx
        .update(featuredLinks)
        .set({ order: reorderedOrder })
        .where(inArray(featuredLinks.id, reorderedIds))
    }
  })

  await invalidateHomeDataCache()
  return { data: { success: true } }
})
