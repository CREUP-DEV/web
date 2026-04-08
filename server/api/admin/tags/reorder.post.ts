import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { invalidateTagsCache } from '../../../utils/adminCacheInvalidation'
import { assertCompleteReorderSet } from '../../../utils/adminReorder'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder tags
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Método no permitido' })
  }

  const body = await readBody(event)

  try {
    const validated = validateBody(updateOrderSchema, body)
    const existingItems = await db.select({ id: tags.id }).from(tags)

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    // Update all items in a transaction
    await db.transaction(async (tx) => {
      for (const item of validated.items) {
        await tx.update(tags).set({ order: item.order }).where(eq(tags.id, item.id))
      }
    })

    await invalidateTagsCache()
    return { success: true }
  } catch (e) {
    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
