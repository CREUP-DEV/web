import { defineEventHandler, readBody } from 'h3'
import { inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { invalidateTagsCache } from '../../../utils/admin/adminCacheInvalidation'
import {
  assertCompleteReorderSet,
  buildReorderOrderExpression,
} from '../../../utils/admin/adminReorder'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder tags
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const validated = validateBody(updateOrderSchema, body)
  const reorderedIds = validated.items.map((item) => item.id)
  const reorderedOrder = buildReorderOrderExpression(tags.id, tags.order, validated.items)

  // Update all items in a transaction
  await db.transaction(async (tx) => {
    const existingItems = await tx.select({ id: tags.id }).from(tags).for('update')

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    if (validated.items.length > 0) {
      await tx.update(tags).set({ order: reorderedOrder }).where(inArray(tags.id, reorderedIds))
    }
  })

  await invalidateTagsCache()
  return { data: { success: true } }
})
