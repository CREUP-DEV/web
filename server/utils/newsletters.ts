import { createError } from 'h3'
import { and, eq, isNull, ne } from 'drizzle-orm'
import { db } from '../db'
import { newsletters, newsletterSubscribers } from '../db/schema'
import { sendNewsletterEmails } from './newsletterMailer'

const MONTH_INPUT_REGEX = /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-01$/

type NewsletterRecord = typeof newsletters.$inferSelect

export interface NewsletterDeliveryResult {
  errorCount: number
  sent: boolean
  sentCount: number
  total: number
}

function padMonth(month: number): string {
  return String(month).padStart(2, '0')
}

export function normalizeNewsletterMonthInput(value: string) {
  const match = MONTH_INPUT_REGEX.exec(value)

  if (!match?.groups) {
    throw createError({ statusCode: 400, message: 'El mes no es válido' })
  }

  const year = Number(match.groups.year)
  const month = Number(match.groups.month)
  const monthKey = `${year}-${padMonth(month)}`

  return {
    monthDate: new Date(Date.UTC(year, month - 1, 1)),
    monthKey,
  }
}

export function monthKeyToDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number)

  return new Date(Date.UTC(year, month - 1, 1))
}

export async function assertNewsletterMonthAvailable(monthKey: string, excludeId?: string) {
  const conditions = [eq(newsletters.monthKey, monthKey)]

  if (excludeId) {
    conditions.push(ne(newsletters.id, excludeId))
  }

  const existing = await db.query.newsletters.findFirst({
    where: conditions.length === 1 ? conditions[0] : and(...conditions),
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Ya existe una newsletter para ese mes',
    })
  }
}

async function getSendableNewsletter(id: string): Promise<NewsletterRecord> {
  const [item] = await db
    .update(newsletters)
    .set({ sending: true })
    .where(
      and(
        eq(newsletters.id, id),
        eq(newsletters.active, true),
        eq(newsletters.sending, false),
        isNull(newsletters.sentAt)
      )
    )
    .returning()

  if (item) {
    return item
  }

  const current = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })

  if (!current) {
    throw createError({ statusCode: 404, message: 'Newsletter no encontrada' })
  }

  if (!current.active) {
    throw createError({
      statusCode: 409,
      message: 'Activa la newsletter antes de enviarla',
    })
  }

  if (current.sentAt) {
    throw createError({
      statusCode: 409,
      message: 'La newsletter ya se ha enviado',
    })
  }

  if (current.sending) {
    throw createError({
      statusCode: 409,
      message: 'La newsletter ya se está enviando',
    })
  }

  throw createError({ statusCode: 409, message: 'No se puede enviar la newsletter' })
}

export async function sendNewsletterById(id: string): Promise<{
  item: NewsletterRecord
  result: NewsletterDeliveryResult
}> {
  const item = await getSendableNewsletter(id)

  return sendClaimedNewsletter(item)
}

export async function sendClaimedNewsletter(item: NewsletterRecord): Promise<{
  item: NewsletterRecord
  result: NewsletterDeliveryResult
}> {
  const id = item.id

  try {
    const subscribers = await db
      .select({
        email: newsletterSubscribers.email,
        id: newsletterSubscribers.id,
        unsubscribeToken: newsletterSubscribers.unsubscribeToken,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.active, true))

    const delivery = await sendNewsletterEmails(item, subscribers)
    const sent = delivery.sentCount > 0

    const [updatedItem] = await db
      .update(newsletters)
      .set({
        sending: false,
        sentAt: sent ? new Date() : null,
      })
      .where(eq(newsletters.id, id))
      .returning()

    return {
      item: updatedItem ?? { ...item, sending: false, sentAt: sent ? new Date() : null },
      result: {
        ...delivery,
        sent,
      },
    }
  } catch (error) {
    await db.update(newsletters).set({ sending: false }).where(eq(newsletters.id, id))

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    if (error instanceof Error && error.message === 'SMTP_CONFIG_MISSING') {
      throw createError({
        statusCode: 500,
        message: 'Falta la configuración SMTP para enviar correos',
      })
    }

    throw createError({
      statusCode: 500,
      message: 'No se pudo enviar la newsletter',
    })
  }
}
