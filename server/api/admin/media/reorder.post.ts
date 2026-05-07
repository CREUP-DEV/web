import { defineEventHandler, readBody } from 'h3'
import { inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { invalidatePressCache } from '../../../utils/admin/adminCacheInvalidation'
import {
  assertCompleteReorderSet,
  buildReorderOrderExpression,
} from '../../../utils/admin/adminReorder'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder media outlets
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const validated = validateBody(updateOrderSchema, body)
  const reorderedIds = validated.items.map((item) => item.id)
  const reorderedOrder = buildReorderOrderExpression(
    mediaOutlets.id,
    mediaOutlets.order,
    validated.items
  )

  await db.transaction(async (tx) => {
    const existingItems = await tx.select({ id: mediaOutlets.id }).from(mediaOutlets).for('update')

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    if (validated.items.length > 0) {
      await tx
        .update(mediaOutlets)
        .set({ order: reorderedOrder })
        .where(inArray(mediaOutlets.id, reorderedIds))
    }
  })

  await invalidatePressCache()
  return { data: { success: true } }
})
