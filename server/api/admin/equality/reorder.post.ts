import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments } from '../../../db/schema'
import { assertCompleteReorderSet } from '../../../utils/adminReorder'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Método no permitido' })
  }

  const body = await readBody(event)

  try {
    const validated = validateBody(updateOrderSchema, body)
    const existingItems = await db.select({ id: equalityDocuments.id }).from(equalityDocuments)

    assertCompleteReorderSet(
      validated.items,
      existingItems.map((item) => item.id)
    )

    await db.transaction(async (tx) => {
      for (const item of validated.items) {
        await tx
          .update(equalityDocuments)
          .set({ order: item.order })
          .where(eq(equalityDocuments.id, item.id))
      }
    })

    return { success: true }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Error de validación',
    })
  }
})
