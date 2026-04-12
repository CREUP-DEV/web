import { defineEventHandler, readBody } from 'h3'
import { inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { assertCompleteReorderSet, buildReorderOrderExpression } from '../../../utils/adminReorder'
import { invalidateHomeDataCache } from '../../../utils/adminCacheInvalidation'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder carousel items
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const validated = validateBody(updateOrderSchema, body)
  const reorderedIds = validated.items.map((item) => item.id)
  const reorderedOrder = buildReorderOrderExpression(
    carouselItems.id,
    carouselItems.order,
    validated.items
  )

  // Update all items in a transaction
  await db.transaction(async (tx) => {
    const existingItems = await tx
      .select({ id: carouselItems.id })
      .from(carouselItems)
      .for('update')

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    if (validated.items.length > 0) {
      await tx
        .update(carouselItems)
        .set({ order: reorderedOrder })
        .where(inArray(carouselItems.id, reorderedIds))
    }
  })

  await invalidateHomeDataCache()
  return { data: { success: true }, success: true }
})
