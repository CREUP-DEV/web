/**
 * Admin Newsletter Item
 * GET    /api/admin/newsletter/:id — Get single newsletter
 * PUT    /api/admin/newsletter/:id — Update newsletter
 * DELETE /api/admin/newsletter/:id — Delete newsletter
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateNewsletterSchema, validateBody } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
} from '../../../utils/newsletters'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET — single newsletter
  if (event.method === 'GET') {
    await requireAuth(event)

    const item = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, id),
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }
    return {
      item: {
        ...item,
        month: monthKeyToDate(item.monthKey),
      },
    }
  }

  // PUT — update
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateNewsletterSchema, body)
      const { monthDate, monthKey } = normalizeNewsletterMonthInput(validated.month)

      await assertNewsletterMonthAvailable(monthKey, id)

      await db
        .update(newsletters)
        .set({
          month: monthDate,
          monthKey,
          coverImage: validated.coverImage,
          pdfUrl: validated.pdfUrl,
          active: validated.active,
        })
        .where(eq(newsletters.id, id))

      const item = await db.query.newsletters.findFirst({
        where: eq(newsletters.id, id),
      })

      return {
        item: item
          ? {
              ...item,
              month: monthKeyToDate(item.monthKey),
            }
          : null,
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e) throw e
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE
  if (event.method === 'DELETE') {
    await requireAuth(event)
    await db.delete(newsletters).where(eq(newsletters.id, id))
    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
