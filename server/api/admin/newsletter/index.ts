/**
 * Admin Newsletter Management
 * GET  /api/admin/newsletter       — List all newsletters (ordered by month desc)
 * POST /api/admin/newsletter       — Create newsletter (+ optionally send to subscribers)
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { desc } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createNewsletterSchema, validateBody } from '../../../utils/validation'
import {
  assertNewsletterMonthAvailable,
  monthKeyToDate,
  normalizeNewsletterMonthInput,
  sendClaimedNewsletter,
} from '../../../utils/newsletters'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    await requireAuth(event)

    const items = await db.select().from(newsletters).orderBy(desc(newsletters.month))

    return {
      items: items.map((item) => ({
        ...item,
        month: monthKeyToDate(item.monthKey),
      })),
    }
  }

  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createNewsletterSchema, body)
      const sendEmail = body.sendEmail === true
      const { monthDate, monthKey } = normalizeNewsletterMonthInput(validated.month)

      await assertNewsletterMonthAvailable(monthKey)

      const [item] = await db
        .insert(newsletters)
        .values({
          month: monthDate,
          monthKey,
          coverImage: validated.coverImage,
          pdfUrl: validated.pdfUrl,
          active: validated.active,
          sending: sendEmail && validated.active,
        })
        .returning()

      if (!item) {
        throw createError({ statusCode: 500, statusMessage: 'Error al crear la newsletter' })
      }

      // Send newsletter emails in background if requested
      if (sendEmail && item.active) {
        // Fire and forget — don't block the response
        sendClaimedNewsletter(item).catch((err: unknown) => {
          console.error('Error sending newsletter emails:', err)
        })
      }

      return {
        item: {
          ...item,
          month: monthKeyToDate(item.monthKey),
        },
        emailQueued: sendEmail && item.active,
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e) throw e
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
