import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks } from '../../../db/schema'
import { assertCompleteReorderSet } from '../../../utils/adminReorder'
import { invalidateHomeDataCache } from '../../../utils/adminCacheInvalidation'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder featured links
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Método no permitido' })
  }

  const body = await readBody(event)

  try {
    const validated = validateBody(updateOrderSchema, body)
    const existingItems = await db.select({ id: featuredLinks.id }).from(featuredLinks)

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    // Update all items in a transaction
    await db.transaction(async (tx) => {
      for (const item of validated.items) {
        await tx
          .update(featuredLinks)
          .set({ order: item.order })
          .where(eq(featuredLinks.id, item.id))
      }
    })

    await invalidateHomeDataCache()
    return { success: true }
  } catch (e) {
    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
