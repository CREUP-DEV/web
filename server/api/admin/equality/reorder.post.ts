import { defineEventHandler, readBody } from 'h3'
import { inArray } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments } from '../../../db/schema'
import { assertCompleteReorderSet, buildReorderOrderExpression } from '../../../utils/adminReorder'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const validated = validateBody(updateOrderSchema, body)
  const reorderedIds = validated.items.map((item) => item.id)
  const reorderedOrder = buildReorderOrderExpression(
    equalityDocuments.id,
    equalityDocuments.order,
    validated.items
  )

  await db.transaction(async (tx) => {
    const existingItems = await tx
      .select({ id: equalityDocuments.id })
      .from(equalityDocuments)
      .for('update')

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    if (validated.items.length > 0) {
      await tx
        .update(equalityDocuments)
        .set({ order: reorderedOrder })
        .where(inArray(equalityDocuments.id, reorderedIds))
    }
  })

  return { success: true }
})
