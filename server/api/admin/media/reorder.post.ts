import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { updateOrderSchema, validateBody } from '../../../utils/validation'

// POST - Reorder media outlets
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Método no permitido' })
  }

  const body = await readBody(event)

  try {
    const validated = validateBody(updateOrderSchema, body)

    await db.transaction(async (tx) => {
      for (const item of validated.items) {
        await tx.update(mediaOutlets).set({ order: item.order }).where(eq(mediaOutlets.id, item.id))
      }
    })

    return { success: true }
  } catch (e) {
    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
