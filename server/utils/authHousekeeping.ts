import { lte } from 'drizzle-orm'
import { db } from '../db'
import { sessions } from '../db/schema'

export interface ExpiredAuthCleanupResult {
  deletedSessionCount: number
}

export async function cleanupExpiredAuthRows(
  now: Date = new Date()
): Promise<ExpiredAuthCleanupResult> {
  const deletedSessions = await db
    .delete(sessions)
    .where(lte(sessions.expiresAt, now))
    .returning({ id: sessions.id })

  return {
    deletedSessionCount: deletedSessions.length,
  }
}
