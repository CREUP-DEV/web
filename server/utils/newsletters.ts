import { createError } from 'h3'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '../db'
import { newsletters } from '../db/schema'

const MONTH_INPUT_REGEX = /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-01$/

// 3 attempts: matches the delivery retry threshold used by the sending worker.
export const NEWSLETTER_DELIVERY_MAX_ATTEMPTS = 3

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
  const [year = 1970, month = 1] = monthKey.split('-').map(Number)

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
